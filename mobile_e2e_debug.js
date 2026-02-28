const { chromium } = require('playwright');
const path = require('path');

const outDir = 'C:\\\\Users\\\\darad\\\\.gemini\\\\antigravity\\\\brain\\\\daf2ab4c-5215-4193-9392-f1bbe016b45d';

const testCO = async () => {
    console.log('Starting Mobile App UI Test as CO/Admin...');
    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch (e) {
        browser = await chromium.launch({ channel: 'chrome', headless: true });
    }

    const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
    });
    const page = await ctx.newPage();

    try {
        console.log('Navigating to login...');
        await page.goto('http://localhost:8100/login');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, 'debug_1_login_loaded.png') });

        const isRolePage = await page.evaluate(() => document.body.innerText.includes('Select Your Role'));
        if (isRolePage) {
            console.log('Selecting role...');
            const coCard = await page.locator('ion-card', { hasText: 'Chief Officer' });
            if (await coCard.count() > 0) {
                await coCard.first().click();
            }
            await page.locator('ion-button', { hasText: 'Continue' }).click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: path.join(outDir, 'debug_2_role_selected.png') });
        }

        console.log('Filling login credentials...');
        await page.fill('input[type="email"], ion-input[type="email"] input', 'daradebhushan15+admin@gmail.com');
        await page.fill('input[type="password"], ion-input[type="password"] input', 'Bbd@123');
        await page.screenshot({ path: path.join(outDir, 'debug_3_credentials_filled.png') });

        // Press Enter to submit the form
        await page.press('input[type="password"], ion-input[type="password"] input', 'Enter');

        // Fallback: forcefully click the large button if enter didn't work
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('ion-button'));
            const signInBtn = btns.find(b => b.innerText.toLowerCase().includes('sign in'));
            if (signInBtn) signInBtn.click();
        });
        console.log('Waiting for Dashboard...');
        await page.waitForTimeout(6000);
        await page.screenshot({ path: path.join(outDir, 'debug_4_after_login.png') });

        const dashboardText = await page.evaluate(() => document.body.innerText);
        if (!dashboardText.includes('Dashboard') && !dashboardText.includes('Total Features')) {
            console.log('Dashboard text not found.');
        } else {
            console.log('✅ Dashboard loaded successfully with stats.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await browser.close();
    }
};

testCO();
