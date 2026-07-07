import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;
const ARTIFACT_DIR = "artifacts/supermarket-v2";
const VITE_BIN = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));

await mkdir(ARTIFACT_DIR, { recursive: true });

const preview = spawn(
  process.execPath,
  [VITE_BIN, "preview", "--host", HOST, "--port", String(PORT), "--strictPort"],
  { stdio: ["ignore", "pipe", "pipe"] },
);

let previewOutput = "";
preview.stdout.on("data", (chunk) => { previewOutput += chunk.toString(); });
preview.stderr.on("data", (chunk) => { previewOutput += chunk.toString(); });

async function waitForServer(timeoutMs = 20_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (preview.exitCode != null) {
      throw new Error(`preview-exited=${preview.exitCode}\n${previewOutput}`);
    }
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`preview-timeout\n${previewOutput}`);
}

async function stopPreview() {
  if (preview.exitCode != null) return;
  preview.kill("SIGTERM");
  await Promise.race([
    once(preview, "exit"),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
  if (preview.exitCode == null) preview.kill("SIGKILL");
}

async function expectCount(locator, count, label) {
  const actual = await locator.count();
  if (actual !== count) throw new Error(`${label}: expected=${count} actual=${actual}`);
}

async function expectText(locator, pattern, label) {
  const text = await locator.textContent();
  if (!pattern.test(text || "")) throw new Error(`${label}: text=${JSON.stringify(text)}`);
}

async function loadAllCases(page) {
  while (await page.locator(".sv2-case:not(:disabled)").count()) {
    await page.locator(".sv2-case:not(:disabled)").first().click();
  }
}

async function selectCartSku(page, label) {
  const button = page.locator(".sv2-cart-unit").filter({ hasText: label }).first();
  if (await button.count() !== 1) throw new Error(`cart-sku-missing=${label}`);
  await button.click();
}

async function placeSelectedIntoReadyGap(page, skuLabel) {
  const ready = page.locator(".sv2-gap.is-ready");
  const count = await ready.count();
  if (count < 1) throw new Error(`ready-gap-${skuLabel}: expected>=1 actual=${count}`);
  await ready.first().click();
}

async function faceCurrentBay(page) {
  await page.getByRole("button", { name: "Face products forward" }).click();
}

async function runShiftOne(page) {
  console.log("SMOKE shift-1 start");
  await expectText(page.locator(".sv2-briefing h1"), /First Top-Up/, "shift1-title");
  await page.getByRole("button", { name: "Clock in" }).click();
  await expectCount(page.locator(".sv2-case"), 3, "shift1-case-count");
  await loadAllCases(page);
  await page.getByRole("button", { name: /Push cart to Drinks wall/ }).click();

  await expectCount(page.locator(".sv2-gap"), 3, "shift1-initial-gaps");
  for (const sku of ["Green Soda", "Red Soda", "Orange Juice"]) {
    await selectCartSku(page, sku);
    await placeSelectedIntoReadyGap(page, sku);
  }

  await expectCount(page.locator(".sv2-gap"), 0, "shift1-gaps-after-stock");
  await faceCurrentBay(page);
  await page.locator(".sv2-complete").waitFor({ state: "visible" });
  await page.screenshot({ path: `${ARTIFACT_DIR}/shift-1-complete-mobile.png`, fullPage: true });
  await page.getByRole("button", { name: "Next shift" }).click();
  console.log("SMOKE shift-1 complete");
}

async function runShiftTwo(page) {
  console.log("SMOKE shift-2 start");
  await expectText(page.locator(".sv2-briefing h1"), /Breakfast Run/, "shift2-title");
  await page.getByRole("button", { name: "Clock in" }).click();
  await expectCount(page.locator(".sv2-case"), 4, "shift2-case-count");
  await loadAllCases(page);
  await page.getByRole("button", { name: /Push cart to Breakfast aisle/ }).click();

  await selectCartSku(page, "Bread");
  await placeSelectedIntoReadyGap(page, "Bread");
  await faceCurrentBay(page);
  await page.getByRole("button", { name: /Push cart to Dairy wall/ }).click();

  await expectCount(page.locator(".sv2-gap"), 3, "shift2-dairy-initial-gaps");
  for (const sku of ["Milk", "Yogurt", "Cheese"]) {
    await selectCartSku(page, sku);
    await placeSelectedIntoReadyGap(page, sku);
  }
  await faceCurrentBay(page);
  await page.locator(".sv2-complete").waitFor({ state: "visible" });
  await page.screenshot({ path: `${ARTIFACT_DIR}/shift-2-complete-mobile.png`, fullPage: true });
  await page.getByRole("button", { name: "Next shift" }).click();
  console.log("SMOKE shift-2 complete");
}

async function runShiftThree(page) {
  console.log("SMOKE shift-3 start");
  await expectText(page.locator(".sv2-briefing h1"), /Morning Rush/, "shift3-title");
  await page.getByRole("button", { name: "Clock in" }).click();
  await expectCount(page.locator(".sv2-case"), 2, "shift3-case-count");
  await loadAllCases(page);
  await page.getByRole("button", { name: /Push cart to Dairy wall/ }).click();

  for (let index = 0; index < 2; index += 1) {
    await selectCartSku(page, "Milk");
    await placeSelectedIntoReadyGap(page, `Milk-${index + 1}`);
  }
  await faceCurrentBay(page);

  await expectText(page.locator(".sv2-message"), /Customer took a milk/i, "shift3-customer-event");
  await expectCount(page.locator(".sv2-gap"), 1, "shift3-customer-gap");
  await selectCartSku(page, "Milk");
  await placeSelectedIntoReadyGap(page, "Milk-recovery");
  await faceCurrentBay(page);
  await page.getByRole("button", { name: /Push cart to Drinks wall/ }).click();

  for (let index = 0; index < 2; index += 1) {
    await selectCartSku(page, "Orange Juice");
    await placeSelectedIntoReadyGap(page, `Juice-${index + 1}`);
  }
  await faceCurrentBay(page);

  await page.locator(".sv2-complete").waitFor({ state: "visible" });
  await expectText(page.locator(".sv2-complete"), /three-shift vertical slice is complete/i, "shift3-final-copy");
  await expectCount(page.getByRole("button", { name: "Next shift" }), 0, "shift3-no-next-button");
  await page.screenshot({ path: `${ARTIFACT_DIR}/shift-3-complete-mobile.png`, fullPage: true });
  console.log("SMOKE shift-3 complete");
}

let browser;
try {
  await waitForServer();
  console.log("SMOKE preview-ready");
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);

  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.locator(".sv2-shell").waitFor({ state: "visible" });
  await expectCount(page.locator(".fridge-shell"), 0, "default-entry-not-v2");
  await page.screenshot({ path: `${ARTIFACT_DIR}/shift-1-briefing-mobile.png`, fullPage: true });

  await runShiftOne(page);
  await runShiftTwo(page);
  await runShiftThree(page);

  if (consoleErrors.length) {
    throw new Error(`browser-console-errors:\n${consoleErrors.join("\n")}`);
  }

  await context.close();
  console.log("OK supermarket-v2-browser default=v2 shifts=3 mobile=true dynamic-customer-gap=true screenshots=4");
} catch (error) {
  console.error(error?.stack || error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await stopPreview();
}
