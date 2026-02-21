const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: { dir: 'videos_settings/' }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(180000);

    console.log('--- STARTING SETTINGS MODULE TEST ---');

    try {
        // --- 1. LOGIN ---
        console.log('[1/5] Login');
        await page.goto('http://localhost:4300/login');
        await page.fill('input[name="email"]', 'admin@nagarparishad.in');
        await page.fill('input[name="password"]', 'password');
        await page.click('button:has-text("Sign In")');
        await page.waitForURL('**/tabs/home');
        console.log('   Login Success.');

        // --- 2. NAVIGATE TO SETTINGS ---
        console.log('[2/5] Navigating to Settings');
        await page.goto('http://localhost:4300/tabs/admin/settings');
        await page.waitForSelector('h2:has-text("SETTINGS")');
        await page.screenshot({ path: 'settings_1_initial.png' });
        console.log('   Settings Page Loaded.');

        // --- 3. TEST TOGGLES PERSISTENCE ---
        console.log('[3/5] Testing Preferences Persistence');

        const toggles = page.locator('ion-toggle');
        await toggles.nth(0).click();
        await page.waitForTimeout(1000);

        await page.reload();
        await page.waitForSelector('h2:has-text("SETTINGS")');

        await page.screenshot({ path: 'settings_2_toggles.png' });

        // --- 4. TEST PROFILE EDIT ---
        console.log('[4/5] Testing Profile Edit');
        await page.click('button:has-text("EDIT_PROFILE")');

        await page.waitForSelector('div.animate-slide-up input[type="text"]');

        const testOrg = 'Test Org ' + Date.now();
        await page.fill('div.animate-slide-up input[type="text"]', testOrg);

        await page.click('button:has-text("SAVE_CHANGES")');

        // Expect Alert/Toast
        await page.waitForSelector('ion-alert');
        await page.click('button.alert-button:has-text("OK")');

        await page.waitForTimeout(1000);

        if (await page.locator(`h3:has-text("${testOrg}")`).count() > 0) {
            console.log('   [PASS] Org Name updated.');
        } else {
            throw new Error('Org Name update not reflected!');
        }
        await page.screenshot({ path: 'settings_3_profile_updated.png' });

        // --- 5. TEST ADMIN LINKS ---
        console.log('[5/5] Testing Admin Navigation');
        // Chatbot link
        const chatbotLink = page.locator('span').filter({ hasText: /Chatbot Settings/i }).first();
        if (await chatbotLink.count() > 0) {
            await chatbotLink.click();
            await page.waitForURL('**/tabs/admin/chatbot');
            console.log('   [PASS] Navigated to Chatbot Settings.');
            await page.screenshot({ path: 'settings_4_navigation.png' });
            await page.goBack();
        } else {
            console.log('   [WARN] Chatbot Settings link not found.');
        }

        console.log('--- TEST COMPLETE ---');

    } catch (e) {
        console.error('TEST FAIL:', e);
        await page.screenshot({ path: 'settings_error.png' });
    } finally {
        await browser.close();
    }
})();
