const { chromium } = require('playwright');
(async() => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 920 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4180/?lang=en', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('seedbound.en.progress', JSON.stringify({ unlocked: 20, coins: 125, current: 0 }));
    localStorage.removeItem('seedbound.storage.fridge-br-1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  const drags = [
    { from: [55, 620], to: [321, 224] },
    { from: [116, 620], to: [321, 382] },
    { from: [177, 620], to: [321, 528] },
    { from: [238, 620], to: [321, 705] },
    { from: [349, 620], to: [247, 532] }
  ];
  for (const drag of drags) {
    await page.mouse.move(drag.from[0], drag.from[1]);
    await page.mouse.down();
    await page.mouse.move(drag.to[0], drag.to[1], { steps: 16 });
    await page.mouse.up();
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'C:/Users/85847/Documents/Codex/2026-06-22/ce/level-1-complete.png', fullPage: false });
  await browser.close();
})();
