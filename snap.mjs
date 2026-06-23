import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: 'C:/Users/85847/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 430, height: 900 });
await p.goto('http://127.0.0.1:5174/');
await p.waitForTimeout(1200);
await p.screenshot({ path: 'snap.png' });
await b.close();
