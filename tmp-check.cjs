const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 764 } });
  await page.goto('http://127.0.0.1:4178/?lang=en', { waitUntil: 'networkidle' });
  const checks = await page.evaluate(() => ({
    title: document.querySelector('main') ? 'mounted' : 'missing',
    level: document.body.textContent.includes('Showcase Fridge'),
    goal: document.body.textContent.includes('0/3'),
    langSwitch: !!document.querySelector('.fridge-lang-switch'),
    quickButtons: document.querySelectorAll('.fridge-quick-btn').length,
  }));
  console.log(JSON.stringify(checks));
  await browser.close();
})();
