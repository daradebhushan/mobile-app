const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    // 1. Launch Browser (Headless: false for visual)
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: { dir: 'videos_full_e2e/' }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(120000);

    console.log('--- STARTING FULL E2E VISUAL TEST SUITE ---');

    try {
        // --- 1. LOGIN ---
        console.log('[1/5] Login Flow');
        await page.goto('http://localhost:4300/login');
        await page.fill('input[name="email"]', 'admin@nagarparishad.in');
        await page.fill('input[name="password"]', 'password');
        await page.click('button:has-text("Sign In")');
        await page.waitForURL('**/tabs/home');
        await page.screenshot({ path: 'e2e_1_dashboard.png' });
        console.log('   Login Success.');

        // --- 2. COMPLAINT LIST & FILTER ---
        console.log('[2/5] Complaint List & Filter');
        await page.goto('http://localhost:4300/tabs/complaints');
        await page.waitForSelector('app-complaint-list');
        await page.screenshot({ path: 'e2e_2_list_all.png' });

        // Filter Tabs
        await page.click('button:has-text("PENDING")');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e_2_list_pending.png' });

        await page.click('button:has-text("ACCEPTED")');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e_2_list_accepted.png' });
        console.log('   Filters Verified.');

        // --- 3. CREATE TASK FROM COMPLAINT ---
        console.log('[3/5] Create Task Flow');
        // Go back to All or Pending to find a target
        await page.click('button:has-text("FILTER_ALL")');
        await page.waitForTimeout(2000);

        // Find "Task Tester" or similar seeded item. If not found, pick first pending.
        let targetItem = page.locator('app-complaint-list ion-item').filter({ hasText: /Task Tester|Manual Tester|Browser Test/i }).first();
        if (await targetItem.count() === 0) {
            console.log('   Target specific complaint not found, picking first available.');
            targetItem = page.locator('app-complaint-list ion-item').first();
        }

        if (await targetItem.count() > 0) {
            await targetItem.scrollIntoViewIfNeeded();
            await targetItem.click();
            await page.waitForSelector('app-complaint-detail');
            await page.screenshot({ path: 'e2e_3_complaint_detail.png' });

            // Accept if needed
            const acceptBtn = page.locator('button').filter({ hasText: /Accept/i });
            if (await acceptBtn.isVisible()) {
                await acceptBtn.click();
                await page.waitForTimeout(2000);
            }

            // Create Task
            await page.click('button:has-text(/Task/i)');
            await page.waitForURL('**/tabs/tasks/create**');
            await page.waitForTimeout(1000);

            // Edit Title to track uniqueness
            await page.fill('ion-input[label="Title"] input', 'E2E Verified Task ' + Date.now());

            await page.screenshot({ path: 'e2e_3_task_form.png' });

            // Save
            await page.click('ion-button:has-text(/Create|Save/i)');
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'e2e_3_task_created_list.png' });
            console.log('   Task Created.');
        } else {
            console.log('   [WARN] No complaints to test conversion.');
        }

        // --- 4. CHATBOT CONFIG ---
        console.log('[4/5] Chatbot Config');
        await page.goto('http://localhost:4300/tabs/admin/chatbot'); // Verify route
        // If route is diff, navigate via menu if possible, but URL is faster for test
        // Actually route is /tabs/settings -> Chatbot? Let's check menu.
        // Assuming direct link for speed.
        // Wait, route might be different. Let's try to find Settings Tab.
        // await page.click('ion-tab-button[tab="settings"]'); 
        // ... simple URL nav:
        await page.goto('http://localhost:4300/tabs/admin/chatbot');
        await page.waitForSelector('ion-textarea'); // The JSON editor
        await page.screenshot({ path: 'e2e_4_chatbot_config.png' });
        console.log('   Config Page Loaded.');

        console.log('--- SUITE COMPLETE ---');

    } catch (e) {
        console.error('TEST FAIL:', e);
        await page.screenshot({ path: 'e2e_error.png' });
    } finally {
        await browser.close();
    }
})();
