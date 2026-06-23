import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/85847/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 430, height: 900 });
await p.goto('http://127.0.0.1:5174/');
await p.waitForTimeout(1200);

const bx = await (await p.$('.fridge-board')).boundingBox();
const items = await p.$$('.grid-item');
let ok = true;
for (const el of items) {
  const box = await el.boundingBox();
  const alt = await el.$eval('img', e => e.alt).catch(() => '?');
  const bottom = ((box.y + box.height - bx.y) / bx.height * 100).toFixed(1);
  const outside = box.y + box.height > bx.y + bx.height;
  console.log(`${alt.padEnd(14)} bottom:${bottom}% ${outside ? '❌ OUT' : '✓'}`);
  if (outside) ok = false;
}
console.log(ok ? '\nAll fixed items inside fridge ✓' : '\nSome items are outside!');
await b.close();
