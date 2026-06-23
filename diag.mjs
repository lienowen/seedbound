import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/85847/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 430, height: 900 });
await p.goto('http://127.0.0.1:5174/');
await p.waitForTimeout(1200);

const bx = await (await p.$('.fridge-board')).boundingBox();
const G = { x:17, y:24, cw:7.2, ch:6.35 };
const gx = c => bx.x + bx.width  * (G.x + (c+0.5)*G.cw) / 100;
const gy = r => bx.y + bx.height * (G.y + (r+0.5)*G.ch) / 100;

// Capture endDrag result via console
const log = [];
p.on('console', m => log.push(m.text()));

// Patch: inject debug into page
await p.addScriptTag({ content: `
  const orig = window.__endDragDebug = {};
` });

// Try mustard at 3 different targets to diagnose
async function tryDrag(trayIdx, col, row) {
  const items = await p.$$('.tray-item');
  const box = await items[trayIdx].boundingBox();
  const sx = box.x + box.width/2, sy = box.y + box.height/2;
  const tx = gx(col), ty = gy(row);
  await p.mouse.move(sx, sy);
  await p.mouse.down();
  for (let i=1; i<=20; i++) await p.mouse.move(sx+(tx-sx)*i/20, sy+(ty-sy)*i/20);
  await p.mouse.up();
  await p.waitForTimeout(600);
  const cls = await items[trayIdx].getAttribute('class');
  const toast = await p.$eval('.action-bar span', e => e.textContent);
  return { placed: cls.includes('placed'), toast, targetCol: col, targetRow: row };
}

// mustard is index 4 - try col2,row0 (definitely free)
const r1 = await tryDrag(4, 2, 0);
console.log('mustard@col2,row0:', JSON.stringify(r1));

// If that worked, try ketchup at col3,row0
const r2 = await tryDrag(5, 3, 0);
console.log('ketchup@col3,row0:', JSON.stringify(r2));

await b.close();
