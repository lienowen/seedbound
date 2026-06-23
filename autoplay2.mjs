import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/85847/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 430, height: 900 });
await p.goto('http://127.0.0.1:5174/');
await p.waitForTimeout(1200);

const bx = await (await p.$('.fridge-board')).boundingBox();
const G = { x:17, y:24, cw:7.2, ch:6.35 };
// Target center of the item footprint (not center of top row)
const tx = (col, w) => bx.x + bx.width  * (G.x + (col + w/2) * G.cw) / 100;
const ty = (row, h) => bx.y + bx.height * (G.y + (row + h/2) * G.ch) / 100;

const SIZES = { eggs:[2,1], strawberries:[2,1], yogurt:[1,1], cake:[2,1], mustard:[1,2], ketchup:[1,2] };

async function place(trayIdx, name, col, row) {
  const [w, h] = SIZES[name];
  const items = await p.$$('.tray-item');
  const box = await items[trayIdx].boundingBox();
  const sx = box.x + box.width/2, sy = box.y + box.height/2;
  const ex = tx(col, w), ey = ty(row, h);
  await p.mouse.move(sx, sy);
  await p.mouse.down();
  for (let i=1; i<=20; i++) await p.mouse.move(sx+(ex-sx)*i/20, sy+(ey-sy)*i/20);
  await p.mouse.up();
  await p.waitForTimeout(500);
  const cls = await items[trayIdx].getAttribute('class');
  const toast = await p.$eval('.action-bar span', e => e.textContent);
  return cls.includes('placed') ? `✓` : `✗ ${toast}`;
}

// Level 0 tray order: eggs(0) strawberries(1) yogurt(2) cake(3) mustard(4) ketchup(5)
const moves = [
  [4, 'mustard',      6, 0],
  [5, 'ketchup',      7, 0],
  [0, 'eggs',         2, 2],
  [2, 'yogurt',       4, 2],
  [3, 'cake',         2, 4],
  [1, 'strawberries', 2, 6],
];
for (const [i, name, col, row] of moves) {
  const r = await place(i, name, col, row);
  console.log(`${name.padEnd(14)} col${col} row${row}: ${r}`);
}

const progress = await p.$eval('.progress-row b', e => e.textContent);
const coins = await p.$eval('.coin-pill', e => e.textContent.trim());
console.log(`\nProgress: ${progress}  Coins: ${coins}`);
await p.screenshot({ path: 'final.png' });
await b.close();
