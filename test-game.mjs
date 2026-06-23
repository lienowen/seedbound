import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false, slowMo: 250 });
const page = await browser.newPage();
await page.setViewportSize({ width: 430, height: 900 });
await page.goto('http://127.0.0.1:5174/');
await page.waitForTimeout(1500);

const board = await page.$('.fridge-board');
const boardBox = await board.boundingBox();
const G = { x: 17, y: 24, cw: 7.2, ch: 6.35 };
const cx = (col) => boardBox.x + boardBox.width  * (G.x + (col + 0.5) * G.cw) / 100;
const cy = (row) => boardBox.y + boardBox.height * (G.y + (row + 0.5) * G.ch) / 100;

async function drag(item, col, row) {
  const box = await item.boundingBox();
  if (!box) return false;
  await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await page.mouse.down();
  await page.waitForTimeout(60);
  for (let s = 1; s <= 15; s++) {
    await page.mouse.move(
      box.x + box.width/2  + (cx(col) - box.x - box.width/2)  * s/15,
      box.y + box.height/2 + (cy(row) - box.y - box.height/2) * s/15
    );
    await page.waitForTimeout(18);
  }
  await page.mouse.up();
  await page.waitForTimeout(400);
  return true;
}

// Level 0: tray = eggs, strawberries, yogurt, cake, mustard, ketchup
const tray = await page.$$('.tray-item');
const moves = [
  [0, 2, 0],  // eggs(2×1)      → col2 row0  top shelf
  [1, 4, 6],  // strawberries   → col4 row6  crisper
  [2, 2, 2],  // yogurt(1×1)    → col2 row2  mid
  [3, 3, 2],  // cake(2×1)      → col3 row2  mid
  [4, 2, 4],  // mustard(1×2)   → col2 row4  lower mid
  [5, 3, 4],  // ketchup(1×2)   → col3 row4  lower mid
];

for (const [idx, col, row] of moves) {
  await drag(tray[idx], col, row);
}

await page.screenshot({ path: 'test-result.png', fullPage: false });
console.log('Done — screenshot saved');
await browser.close();
