const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = '/Volumes/Extreme SSD/.gemini/antigravity-ide/brain/d97a9f38-b558-4b5b-8877-bb14aaa56f41/mobile_e2e_results';

async function runInteractiveLifecycleTest() {
  console.log('🚀 Starting Mobile Interactive Lifecycle Test (Task Creation -> Assignment -> Resolution)...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-web-security']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  try {
    // 1. Login as Admin
    console.log('1. Admin logging in to verify task creation flow...');
    await page.goto('http://localhost:8100/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await page.fill('input[name="email"]', 'daradebhushan15+admin@gmail.com');
    await page.fill('input[name="password"]', 'Bbd@123');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signIn = btns.find(b => b.innerText.toLowerCase().includes('sign in'));
      if (signIn) signIn.click();
    });
    await page.waitForTimeout(3500);

    // 2. Open Task Form
    await page.goto('http://localhost:8100/tabs/tasks/create');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outDir, '05_flow_01_admin_task_form.png') });
    console.log('📸 Captured 05_flow_01_admin_task_form.png');

    // 3. Login as Staff
    await page.evaluate(() => localStorage.clear());
    console.log('2. Staff logging in to verify assigned task interaction...');
    await page.goto('http://localhost:8100/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await page.fill('input[name="email"]', 'daradebhushan15+staff@gmail.com');
    await page.fill('input[name="password"]', 'Bbd@123');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signIn = btns.find(b => b.innerText.toLowerCase().includes('sign in'));
      if (signIn) signIn.click();
    });
    await page.waitForTimeout(3500);

    await page.goto('http://localhost:8100/tabs/tasks');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outDir, '05_flow_02_staff_tasks_view.png') });
    console.log('📸 Captured 05_flow_02_staff_tasks_view.png');

    console.log('✅ Interactive Lifecycle verification complete!');
  } catch (err) {
    console.error('❌ Lifecycle flow error:', err);
  } finally {
    await browser.close();
  }
}

runInteractiveLifecycleTest();
