const { chromium } = require('playwright');
(async() => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 920 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4180/?lang=en', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'C:/Users/85847/Documents/Codex/2026-06-22/ce/seedbound-latest-shot.png', fullPage: true });
  await browser.close();
})();
