const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = 'C:/Users/darad/.gemini/antigravity-ide/brain/b2633984-8c5b-48f1-ab42-f913b7dbd0d7';
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// Log message helper
function logHeader(msg) {
    console.log(`\n==================================================`);
    console.log(`=== ${msg.toUpperCase()}`);
    console.log(`==================================================`);
}

const runBrowserTest = async () => {
    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-web-security'] });
    } catch (e) {
        console.log('Falling back to local chrome...');
        browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-web-security'] });
    }

    const testUserSession = async (email, password, roleName) => {
        logHeader(`Testing Session for Role: ${roleName} (${email})`);
        
        const ctx = await browser.newContext({
            viewport: { width: 390, height: 844 }, // Mobile Viewport size
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15'
        });
        
        const page = await ctx.newPage();
        
        let hasUnauthorizedRedirect = false;
        let consoleAlertMsg = null;

        // Catch window dialogs (like alert/confirm)
        page.on('dialog', async dialog => {
            console.log(`[ALERT/DIALOG]: ${dialog.message()}`);
            consoleAlertMsg = dialog.message();
            await dialog.accept();
        });

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('401 Unauthorized') || text.includes('Redirecting to home')) {
                console.log(`[CONSOLE REDIRECT]: ${text}`);
                hasUnauthorizedRedirect = true;
            }
        });

        try {
            // Step 1: Login page
            console.log('Step 1: Navigating to Login Page...');
            await page.goto('http://localhost:8100/login');
            await page.waitForTimeout(2000);
            
            // Choose Role Screen
            const isRolePage = await page.evaluate(() => document.body.innerText.includes('Select Your Role'));
            if (isRolePage) {
                console.log('Selecting role card...');
                let cardText = 'Staff';
                if (roleName === 'OWNER') cardText = 'Owner';
                else if (roleName === 'ADMIN') cardText = 'Chief Officer';
                
                const card = await page.locator('ion-card', { hasText: cardText });
                if (await card.count() > 0) {
                    await card.first().click();
                } else {
                    await page.locator('ion-card').first().click();
                }
                await page.locator('ion-button', { hasText: 'Continue' }).click();
                await page.waitForTimeout(1000);
            }

            await page.fill('input[name="email"]', email);
            await page.fill('input[name="password"]', password);
            await page.click('button:has-text("Sign In")');
            await page.waitForTimeout(5000); // Wait for dashboard stats
            
            await page.screenshot({ path: path.join(outDir, `${roleName.toLowerCase()}_01_dashboard.png`) });
            console.log(`Captured ${roleName} dashboard screenshot.`);

            const bodyText = await page.evaluate(() => document.body.innerText);

            // Step 2: Verify Stats & Dashboard Components
            if (roleName === 'OWNER') {
                const hasAdminsCount = bodyText.includes('Admins') || bodyText.includes('प्रशासक');
                console.log(`- Verified Owner Dashboard elements: ${hasAdminsCount ? 'OK ✅' : 'FAIL ❌'}`);
            } else if (roleName === 'ADMIN') {
                const hasDeptsCard = bodyText.includes('Active Departments') || bodyText.includes('सक्रिय विभाग');
                console.log(`- Verified Admin Dashboard elements: ${hasDeptsCard ? 'OK (Departments card visible) ✅' : 'FAIL ❌'}`);
            } else if (roleName === 'STAFF') {
                const hasDeptsCard = bodyText.includes('Active Departments') || bodyText.includes('सक्रिय विभाग');
                console.log(`- Verified Staff Dashboard elements: ${!hasDeptsCard ? 'OK (Departments card hidden) ✅' : 'FAIL (Departments card visible) ❌'}`);
            }

            // Step 3: Verify floating "+" button on Tasks Page
            console.log('Step 3: Navigating to Tasks tab...');
            await page.goto('http://localhost:8100/tabs/tasks');
            await page.waitForTimeout(3000);
            await page.screenshot({ path: path.join(outDir, `${roleName.toLowerCase()}_02_tasks_list.png`) });
            
            const hasPlusButton = await page.evaluate(() => {
                const fab = document.querySelector('ion-fab');
                return fab !== null && window.getComputedStyle(fab).display !== 'none';
            });
            
            if (roleName === 'STAFF') {
                console.log(`- Staff Task creation FAB button presence: ${!hasPlusButton ? 'HIDDEN ✅' : 'VISIBLE (FAIL) ❌'}`);
            } else {
                console.log(`- Admin/Owner Task creation FAB button presence: ${hasPlusButton ? 'VISIBLE ✅' : 'HIDDEN (FAIL) ❌'}`);
            }

            // Step 4: Verify Route Guards
            console.log('Step 4: Attempting to access admin-only route (/tabs/admin/departments)...');
            consoleAlertMsg = null;
            await page.goto('http://localhost:8100/tabs/admin/departments');
            await page.waitForTimeout(3000);
            await page.screenshot({ path: path.join(outDir, `${roleName.toLowerCase()}_03_admin_route_check.png`) });

            const currentUrl = page.url();
            if (roleName === 'STAFF') {
                const isBlocked = currentUrl.includes('/login') || consoleAlertMsg !== null;
                console.log(`- Route Guard Check for STAFF: ${isBlocked ? 'ACCESS BLOCKED ✅' : 'ACCESS GRANTED (FAIL) ❌'}`);
            } else {
                const isAllowed = currentUrl.includes('/tabs/admin/departments');
                console.log(`- Route Guard Check for Admin/Owner: ${isAllowed ? 'ACCESS ALLOWED ✅' : 'ACCESS BLOCKED (FAIL) ❌'}`);
            }

        } catch (error) {
            console.error(`Error during E2E verification for ${roleName}:`, error);
        } finally {
            await ctx.close();
        }
    };

    // Run verification for Owner, Admin, and Staff sequentially
    await testUserSession('owner@govt.in', 'password', 'OWNER');
    await testUserSession('daradebhushan15+admin@gmail.com', 'Bbd@123', 'ADMIN');
    await testUserSession('staff_test@loknagar.com', 'Password@123', 'STAFF');

    await browser.close();
    console.log('\n==================================================');
    console.log('=== ROLE-BASED E2E BROWSER TESTS EXECUTED COMPLETED');
    console.log('==================================================\n');
};

runBrowserTest();
