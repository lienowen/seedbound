import { chromium } from 'playwright';
const execPath = 'C:/Users/85847/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe';
const browser = await chromium.launch({ executablePath: execPath, headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 430, height: 900 });
await page.goto('http://127.0.0.1:5174/');
await page.waitForTimeout(1200);

const boardBox = await (await page.$('.fridge-board')).boundingBox();
const gridItems = await page.$$('.grid-item');

// Report each item's position as % of board
for (const el of gridItems) {
  const box = await el.boundingBox();
  const cls = await el.getAttribute('class');
  const img = await el.$('img');
  const alt = img ? await img.getAttribute('alt') : '?';
  const topPct  = ((box.y - boardBox.y) / boardBox.height * 100).toFixed(1);
  const leftPct = ((box.x - boardBox.x) / boardBox.width  * 100).toFixed(1);
  const botPct  = ((box.y + box.height - boardBox.y) / boardBox.height * 100).toFixed(1);
  console.log(`${alt.padEnd(14)} left:${leftPct}% top:${topPct}% bottom:${botPct}% fixed:${cls.includes('fixed')}`);
}
await browser.close();
