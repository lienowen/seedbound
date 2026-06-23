import { chromium } from 'playwright';
const EXE = 'C:/Users/85847/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe';
const b = await chromium.launch({ executablePath: EXE, headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 430, height: 900 });
await p.goto('http://127.0.0.1:5174/');
await p.waitForTimeout(1200);

const board = await p.$('.fridge-board');
const bx = await board.boundingBox();
const G = { x:17, y:24, cw:7.2, ch:6.35 };
const gx = (col) => bx.x + bx.width  * (G.x + (col+0.5)*G.cw) / 100;
const gy = (row) => bx.y + bx.height * (G.y + (row+0.5)*G.ch) / 100;

async function tryPlace(trayIndex, col, row) {
  const items = await p.$$('.tray-item');
  const item = items[trayIndex];
  if (!item) return 'no item';
  const cls = await item.getAttribute('class');
  if (cls.includes('placed')) return 'already placed';
  const box = await item.boundingBox();
  const sx = box.x + box.width/2, sy = box.y + box.height/2;
  const tx = gx(col), ty = gy(row);
  await p.mouse.move(sx, sy);
  await p.mouse.down();
  for (let i=1; i<=20; i++) await p.mouse.move(sx+(tx-sx)*i/20, sy+(ty-sy)*i/20);
  await p.mouse.move(tx, ty);
  await p.waitForTimeout(50);
  await p.mouse.up();
  await p.waitForTimeout(500);
  const cls2 = await item.getAttribute('class');
  return cls2.includes('placed') ? '✓ placed' : '✗ failed';
}

// Level 0 tray: eggs(0), strawberries(1), yogurt(2), cake(3), mustard(4), ketchup(5)
// Place in ideal zones, avoiding fixed items
const moves = [
  [4, 6, 0],  // mustard → top shelf (ideal zone 0-1)
  [5, 7, 0],  // ketchup → top shelf
  [0, 2, 2],  // eggs    → mid shelf (ideal zone 2-5)
  [2, 4, 2],  // yogurt  → mid shelf
  [3, 2, 4],  // cake    → mid shelf
  [1, 2, 6],  // strawberries → crisper (ideal zone 6-9)
];

for (const [idx, col, row] of moves) {
  const r = await tryPlace(idx, col, row);
  const names = ['eggs','strawberries','yogurt','cake','mustard','ketchup'];
  console.log(`${names[idx].padEnd(14)} → col${col},row${row}: ${r}`);
}

const toast = await p.$eval('.action-bar span', el => el.textContent);
const coins = await p.$eval('.coin-pill', el => el.textContent.trim());
console.log('\nToast:', toast);
console.log('Coins:', coins);

await p.screenshot({ path: 'autoplay-result.png' });
await b.close();
