import { access, readFile } from "node:fs/promises";

const errors = [];

function fail(message) {
  errors.push(message);
}

const [router, v2Entry, legacyBootstrap] = await Promise.all([
  readFile("src/mainRouter.jsx", "utf8"),
  readFile("src/supermarket-v2/SupermarketV2Entry.jsx", "utf8"),
  readFile("src/legacyAppBootstrap.js", "utf8"),
]);

if (!router.includes("const useSupermarketV2 = !forceLegacy")) {
  fail("router:v2-not-default");
}
if (!router.includes('params.get("legacy") === "true"')) {
  fail("router:legacy-escape-missing");
}
if (router.includes('import "./fridge-phaser.css"')) {
  fail("router:legacy-css-global");
}
if (router.includes("replenishment-root.css") || router.includes("replenishment-planogram.css")) {
  fail("router:v2-css-global");
}

if (!v2Entry.includes('import "./replenishment-root.css"')) {
  fail("v2-entry:root-css-missing");
}
if (!v2Entry.includes('import "./replenishment-planogram.css"')) {
  fail("v2-entry:planogram-css-missing");
}
if (!v2Entry.includes("ReplenishmentShiftGame")) {
  fail("v2-entry:active-game-missing");
}

if (!legacyBootstrap.includes('import("./fridge-phaser.css")')) {
  fail("legacy:css-not-dynamic");
}

for (const obsolete of [
  "src/supermarket-v2/SupermarketShiftGame.jsx",
  "src/supermarket-v2/MorningRushGame.jsx",
]) {
  try {
    await access(obsolete);
    fail(`obsolete-ui-still-present:${obsolete}`);
  } catch {
    // Expected: obsolete parallel implementation has been deleted.
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`FAIL ${error}`));
  process.exitCode = 1;
} else {
  console.log("OK supermarket-v2-entry default=v2 css-isolated=true legacy-explicit=true obsolete-ui=false");
}
