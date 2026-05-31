const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = 'C:/Users/darad/.gemini/antigravity-ide/brain/b2633984-8c5b-48f1-ab42-f913b7dbd0d7';
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const runBrowserTest = async () => {
    console.log('Starting Local Browser Verification Test for staff_test...');
    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-web-security'] });
    } catch (e) {
        console.log('Falling back to local chrome...');
        browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-web-security'] });
    }

    const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 }, // Mobile Viewport size
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await ctx.newPage();

    let hasUnauthorizedRedirects = false;
    let interceptedLogs = [];

    page.on('console', msg => {
        const text = msg.text();
        interceptedLogs.push(`[CONSOLE] ${msg.type()}: ${text}`);
        console.log(`[CONSOLE] ${msg.type()}: ${text}`);
        if (text.includes('401 Unauthorized') || text.includes('Logging out') || text.includes('Redirecting to home')) {
            console.log('🔴 DETECTED UNAUTHORIZED LOGOUT ATTEMPT IN CONSOLE LOGS!');
            hasUnauthorizedRedirects = true;
        }
    });

    try {
        // Step 1: Navigating to Login Page
        console.log('Step 1: Navigating to Login Page...');
        await page.goto('http://localhost:8100/login');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, 'local_01_login_page.png') });

        // Step 2: Log in as staff_test
        console.log('Step 2: Authenticating as staff_test...');
        
        // Handle optional Select Role screen if it shows up
        const isRolePage = await page.evaluate(() => document.body.innerText.includes('Select Your Role'));
        if (isRolePage) {
            console.log('Selecting role...');
            const staffCard = await page.locator('ion-card', { hasText: 'Staff' }).or(page.locator('ion-card', { hasText: 'Department Head' }));
            if (await staffCard.count() > 0) {
                await staffCard.first().click();
            } else {
                await page.locator('ion-card').first().click();
            }
            await page.locator('ion-button', { hasText: 'Continue' }).click();
            await page.waitForTimeout(1000);
        }

        await page.fill('input[name="email"]', 'staff_test@loknagar.com');
        await page.fill('input[name="password"]', 'Password@123');
        await page.screenshot({ path: path.join(outDir, 'local_02_credentials_filled.png') });

        console.log('Clicking Sign In...');
        await page.click('button:has-text("Sign In")');

        // Step 3: Wait for dashboard and verify
        console.log('Step 3: Verifying Dashboard load...');
        await page.waitForTimeout(6000); // Wait for API calls
        await page.screenshot({ path: path.join(outDir, 'local_03_dashboard_loaded.png') });

        if (hasUnauthorizedRedirects) {
            throw new Error('Verification Failed: App redirected or threw unauthorized errors immediately after login.');
        }

        // Verify if "Active Departments" card is hidden
        const bodyText = await page.evaluate(() => document.body.innerText);
        const hasActiveDeptsCard = bodyText.includes('Active Departments') || bodyText.includes('सक्रिय विभाग') || bodyText.includes('सक्रीय विभाग');
        
        console.log(`- Active Departments card presence: ${hasActiveDeptsCard ? 'VISIBLE 🔴' : 'HIDDEN ✅'}`);
        if (hasActiveDeptsCard) {
            throw new Error('Verification Failed: Active Departments card is visible on dashboard! It should be hidden for STAFF.');
        }

        // Step 4: Click the "Direct Tasks Pending" card
        console.log('Step 4: Clicking Direct Tasks Pending card...');
        await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('div'));
            const pendingCard = cards.find(c => 
                c.className.includes('from-purple-500') || 
                c.innerText.includes('DIRECT_TASKS_PENDING') ||
                c.innerText.includes('Direct Tasks Pending') ||
                c.innerText.includes('Direct Tasks')
            );
            if (pendingCard) {
                pendingCard.click();
            } else {
                console.log('Could not find pending card, looking for clickable elements...');
                // try standard classes
                const divs = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('Tasks') || d.innerText.includes('काम'));
                if (divs.length > 0) divs[0].click();
            }
        });
        await page.waitForTimeout(4000);
        await page.screenshot({ path: path.join(outDir, 'local_04_tasks_view.png') });

        if (hasUnauthorizedRedirects) {
             throw new Error('Verification Failed: Navigation to Tasks list triggered an unauthorized redirect/logout!');
        }

        // Verify that the floating "+" button is NOT visible on tasks page
        const hasPlusButton = await page.evaluate(() => {
            const fab = document.querySelector('ion-fab');
            return fab !== null && window.getComputedStyle(fab).display !== 'none';
        });
        console.log(`- Task creation "+" FAB button presence: ${hasPlusButton ? 'VISIBLE 🔴' : 'HIDDEN ✅'}`);
        if (hasPlusButton) {
            throw new Error('Verification Failed: Task creation FAB button (+) is visible to STAFF user!');
        }

        console.log('✅ ALL BROWSER E2E SCENARIOS VERIFIED SUCCESSFULLY FOR staff_test LOCALLY!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
};

runBrowserTest();
