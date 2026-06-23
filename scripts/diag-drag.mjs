import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__seedboundFridge?.getGame?.());
await page.waitForTimeout(2000);

const overlay = await page.locator(".fridge-result").isVisible();
console.log("Result overlay visible:", overlay);

const canvas = page.locator("canvas");
const box = await canvas.boundingBox();
const px = (120 / 750) * box.width;
const py = (1125 / 1334) * box.height;

await canvas.hover({ position: { x: px, y: py } });
await page.mouse.down();
await page.waitForTimeout(100);

const mid = await page.evaluate(() => {
  const sprite = window.__seedboundFridge.getGame().scene.getScene("storage").sprites.get("mustard_1");
  return { x: sprite.x, y: sprite.y, dragging: !!window.__seedboundFridge.getGame().scene.getScene("storage").dragItem };
});
console.log("After mousedown:", mid);

await page.mouse.move(box.x + px + 50, box.y + py - 100, { steps: 5 });
await page.waitForTimeout(100);
const moved = await page.evaluate(() => {
  const scene = window.__seedboundFridge.getGame().scene.getScene("storage");
  const sprite = scene.sprites.get("mustard_1");
  return { x: sprite.x, y: sprite.y, dragging: !!scene.dragItem };
});
console.log("While dragging:", moved);
await page.mouse.up();
await browser.close();
