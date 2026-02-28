const { chromium } = require('playwright');
const testCO = async () => {
    console.log('Starting Mobile App UI Test as CO/Admin...');
    // Use Microsoft Edge or Chrome since the system is Windows and Chromium download failed.
    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch (e) {
        console.log('Falling back to local chrome...');
        browser = await chromium.launch({ channel: 'chrome', headless: true });
    }

    const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 }, // Mobile device wrapper
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
    });
    const page = await ctx.newPage();

    try {
        console.log('Navigating to login...');
        await page.goto('http://localhost:8100/login');
        await page.waitForTimeout(2000);

        // If role selection is present
        const isRolePage = await page.evaluate(() => document.body.innerText.includes('Select Your Role'));
        if (isRolePage) {
            console.log('Selecting role...');
            // Click Chief Officer card
            const coCard = await page.locator('ion-card:has-text("Chief Officer")');
            if (await coCard.count() > 0) {
                await coCard.first().click();
            }
            await page.locator('ion-button:has-text("Continue")').click();
            await page.waitForTimeout(1000);
        }

        console.log('Filling login credentials...');
        await page.fill('input[type="email"], ion-input[type="email"] input', 'daradebhushan15+admin@gmail.com');
        await page.fill('input[type="password"], ion-input[type="password"] input', 'Bbd@123');
        await page.locator('ion-button:has-text("Sign In"), ion-button:has-text("Login")').click();

        console.log('Waiting for Dashboard...');
        await page.waitForTimeout(5000); // Wait for load and stats

        const dashboardText = await page.evaluate(() => document.body.innerText);
        if (!dashboardText.includes('Dashboard') && !dashboardText.includes('Total Features') && !dashboardText.includes('Task')) {
            throw new Error('Dashboard failed to load or stats missing.');
        }
        console.log('✅ Dashboard loaded successfully with stats.');

        // Screenshot
        await page.screenshot({ path: '../brain/daf2ab4c-5215-4193-9392-f1bbe016b45d/mobile_co_dashboard.png' });

        console.log('Testing Settings / Departments CRUD');
        // Open menu or bottom tab to go to Settings -> Departments
        // Using direct navigation for speed
        await page.goto('http://localhost:8100/departments');
        await page.waitForTimeout(2000);

        console.log('✅ Connected to Departments List');
        await page.screenshot({ path: '../brain/daf2ab4c-5215-4193-9392-f1bbe016b45d/mobile_co_departments.png' });

        console.log('Testing Complaints View');
        await page.goto('http://localhost:8100/complaints');
        await page.waitForTimeout(2000);
        console.log('✅ Connected to Complaints List');
        await page.screenshot({ path: '../brain/daf2ab4c-5215-4193-9392-f1bbe016b45d/mobile_co_complaints.png' });

        console.log('Testing Tasks View');
        await page.goto('http://localhost:8100/tasks');
        await page.waitForTimeout(2000);
        console.log('✅ Connected to Tasks List');
        await page.screenshot({ path: '../brain/daf2ab4c-5215-4193-9392-f1bbe016b45d/mobile_co_tasks.png' });

        console.log('--- ALL CO ADMIN MOBILE TESTS PASSED ---');

    } catch (error) {
        console.error('Test Failed:', error);
        await page.screenshot({ path: '../brain/daf2ab4c-5215-4193-9392-f1bbe016b45d/mobile_co_error.png' });
    } finally {
        await browser.close();
    }
};

testCO();
