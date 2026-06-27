const { chromium } = require('playwright');
(async() => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 920 }, deviceScaleFactor: 1 });
  for (let level = 0; level < 5; level++) {
    await page.goto('http://127.0.0.1:4180/?lang=en', { waitUntil: 'domcontentloaded' });
    await page.evaluate((current) => {
      localStorage.setItem('seedbound.en.progress', JSON.stringify({ unlocked: 20, coins: 125, current }));
    }, level);
    await page.reload({ waitUntil: 'networkidle' });
    await page.screenshot({ path: `C:/Users/85847/Documents/Codex/2026-06-22/ce/level-${level + 1}.png`, fullPage: false });
  }
  await browser.close();
})();
