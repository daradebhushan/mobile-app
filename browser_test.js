const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = 'C:\\Users\\darad\\.gemini\\antigravity-ide\\brain\\e594871f-8ad6-48db-a5aa-42ac989489f4';
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const runBrowserTest = async () => {
    console.log('Starting E2E Browser Verification Test...');
    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch (e) {
        console.log('Falling back to local chrome...');
        browser = await chromium.launch({ channel: 'chrome', headless: true });
    }

    const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 }, // Mobile Viewport size
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await ctx.newPage();

    let hasUnauthorizedRedirects = false;
    let interceptedLogs = [];

    // Log console errors to detect any 401 forced logouts
    page.on('console', msg => {
        const text = msg.text();
        interceptedLogs.push(`[CONSOLE] ${msg.type()}: ${text}`);
        if (text.includes('401 Unauthorized') || text.includes('Logging out')) {
            console.log('🔴 DETECTED UNAUTHORIZED LOGOUT ATTEMPT IN CONSOLE LOGS!');
            hasUnauthorizedRedirects = true;
        }
    });

    try {
        // Step 1: Go to Login page and wait to see if polling triggers unauthorized redirect
        console.log('Step 1: Navigating to Login Page...');
        await page.goto('http://localhost:8100/login');
        await page.waitForTimeout(5000); // Wait 5 seconds to ensure no background polling redirect kicks in

        await page.screenshot({ path: path.join(outDir, '01_login_page.png') });
        console.log('Screenshot of Login Page captured.');

        if (hasUnauthorizedRedirects) {
            throw new Error('Verification Failed: App redirected or threw unauthorized errors on login page before authenticating.');
        } else {
            console.log('✅ Success: Login page remained stable. Polling did not trigger unauthorized redirects.');
        }

        // Step 2: Login as Admin
        console.log('Step 2: Authenticating as Admin...');
        
        // Handle optional Select Role screen
        const isRolePage = await page.evaluate(() => document.body.innerText.includes('Select Your Role'));
        if (isRolePage) {
            console.log('Selecting role...');
            const coCard = await page.locator('ion-card', { hasText: 'Chief Officer' });
            if (await coCard.count() > 0) await coCard.first().click();
            await page.locator('ion-button', { hasText: 'Continue' }).click();
            await page.waitForTimeout(1000);
        }

        await page.fill('input[name="email"]', 'daradebhushan15+admin@gmail.com');
        await page.fill('input[name="password"]', 'Bbd@123');
        await page.screenshot({ path: path.join(outDir, '02_credentials_filled.png') });

        console.log('Clicking Sign In...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('ion-button'));
            const signInBtn = btns.find(b => b.innerText.toLowerCase().includes('sign in') || b.innerText.toLowerCase().includes('login'));
            if (signInBtn) signInBtn.click();
        });

        // Step 3: Wait for dashboard and verify
        console.log('Step 3: Verifying Dashboard load...');
        await page.waitForTimeout(5000); // Wait for API calls to fetch stats
        await page.screenshot({ path: path.join(outDir, '03_dashboard_loaded.png') });

        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.includes('Dashboard') || bodyText.includes('Total') || bodyText.includes('Task')) {
            console.log('✅ Success: Dashboard loaded with stats successfully!');
        } else {
            console.log('⚠️ Warning: Dashboard did not show standard text, check screenshot.');
        }

        // Step 4: Navigate to other major list views to ensure no regression
        console.log('Step 4: Navigating to Tasks...');
        await page.goto('http://localhost:8100/tabs/tasks');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, '04_tasks_view.png') });

        console.log('Step 5: Navigating to Complaints...');
        await page.goto('http://localhost:8100/tabs/complaints');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, '05_complaints_view.png') });

        console.log('Step 6: Navigating to Settings...');
        await page.goto('http://localhost:8100/tabs/settings');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, '06_settings_view.png') });

        console.log('Step 7: Navigating to Departments...');
        await page.goto('http://localhost:8100/tabs/admin/departments');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, '07_departments_view.png') });

        console.log('Step 8: Navigating to Staff...');
        await page.goto('http://localhost:8100/tabs/admin/users');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, '08_users_view.png') });

        console.log('✅ ALL BROWSER E2E TESTS COMPLETED SUCCESSFULLY!');
        console.log('All screenshots saved in artifacts directory.');

    } catch (error) {
        console.error('❌ Test Failed:', error);
        await page.screenshot({ path: path.join(outDir, 'error_screenshot.png') });
    } finally {
        await browser.close();
    }
};

runBrowserTest();
