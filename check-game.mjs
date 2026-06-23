import { chromium } from 'playwright';
const execPath = 'C:/Users/85847/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe';
const browser = await chromium.launch({ executablePath: execPath, headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 430, height: 900 });
await page.goto('http://127.0.0.1:5174/');
await page.waitForTimeout(1200);

// Check board and grid item positions
const boardBox = await (await page.$('.fridge-board')).boundingBox();
const gridItems = await page.$$('.grid-item');
const fixedItems = await page.$$('.grid-item.fixed');
const trayItems = await page.$$('.tray-item');

console.log('Board:', JSON.stringify(boardBox, null, 0));
console.log('Total grid items:', gridItems.length, '(fixed:', fixedItems.length, ')');
console.log('Tray items:', trayItems.length);

// Check if any grid items are outside the board
for (const el of gridItems) {
  const box = await el.boundingBox();
  const cls = await el.getAttribute('class');
  const outOfBounds = box.y + box.height > boardBox.y + boardBox.height || box.y < boardBox.y;
  if (outOfBounds) console.log('OUT OF BOUNDS:', cls, JSON.stringify(box));
}

// Check console errors
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.waitForTimeout(300);
if (errors.length) console.log('JS errors:', errors);
else console.log('No JS errors');

await browser.close();
