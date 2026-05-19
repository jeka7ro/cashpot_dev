import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');
  
  // Wait for load
  await page.waitForTimeout(2000);
  
  // Login if needed or set localStorage to fake login
  await page.evaluate(() => {
    localStorage.setItem('cashpot_logged_in', 'true');
    localStorage.setItem('cashpot_cms_play_arena', JSON.stringify({
      enabled: true,
      coins: 348,
      size: 's',
      widgetPosition: 'sidebar'
    }));
    localStorage.setItem('cashpot_cms_sidebar_widgets', JSON.stringify({
      luckyWheel: { enabled: true, title: 'Roata Norocului', spinsAvailable: 1, size: 'l' },
      cashbackProgress: { enabled: true, level: 'Silver', percentage: 12, points: 2450, nextLevel: 'Gold', size: 'm' },
      promoCards: []
    }));
  });
  
  await page.reload();
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  await browser.close();
})();
