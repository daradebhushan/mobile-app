const { chromium } = require('playwright');
const path = require('path');

const outDir = 'C:\\\\Users\\\\darad\\\\.gemini\\\\antigravity\\\\brain\\\\daf2ab4c-5215-4193-9392-f1bbe016b45d';

const testCOFull = async () => {
    console.log('Starting Full Mobile E2E Test as CO/Admin...');
    let browser = await chromium.launch({ channel: 'msedge', headless: true }).catch(() => chromium.launch({ channel: 'chrome', headless: true }));

    const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await ctx.newPage();

    try {
        console.log('1. Logging in...');
        await page.goto('http://localhost:8100/login');
        await page.waitForTimeout(2000);
        const isRolePage = await page.evaluate(() => document.body.innerText.includes('Select Your Role'));
        if (isRolePage) {
            const coCard = await page.locator('ion-card', { hasText: 'Chief Officer' });
            if (await coCard.count() > 0) await coCard.first().click();
            await page.locator('ion-button', { hasText: 'Continue' }).click();
            await page.waitForTimeout(1000);
        }

        await page.fill('input[type="email"], ion-input[type="email"] input', 'daradebhushan15+admin@gmail.com');
        await page.fill('input[type="password"], ion-input[type="password"] input', 'Bbd@123');
        await page.press('input[type="password"], ion-input[type="password"] input', 'Enter');

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('ion-button'));
            const signInBtn = btns.find(b => b.innerText.toLowerCase().includes('sign in'));
            if (signInBtn) signInBtn.click();
        });

        console.log('2. Verifying Dashboard...');
        await page.waitForTimeout(4000);
        await page.screenshot({ path: path.join(outDir, 'mobile_admin_01_dashboard.png') });

        console.log('3. Navigating to Complaints...');
        await page.goto('http://localhost:8100/complaints');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, 'mobile_admin_02_complaints.png') });

        console.log('4. Navigating to Tasks...');
        await page.goto('http://localhost:8100/tasks');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, 'mobile_admin_03_tasks.png') });

        console.log('5. Navigating to Settings...');
        await page.goto('http://localhost:8100/settings');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, 'mobile_admin_04_settings.png') });

        console.log('6. Navigating to Departments...');
        await page.goto('http://localhost:8100/departments');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, 'mobile_admin_05_departments.png') });

        console.log('7. Navigating to Users/Staff...');
        await page.goto('http://localhost:8100/users');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, 'mobile_admin_06_users.png') });

        console.log('✅ ALL ADMIN E2E SCENARIOS CAPTURED!');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await browser.close();
    }
};

testCOFull();
