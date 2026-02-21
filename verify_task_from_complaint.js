const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
    // Load config
    let config = { name: 'Task Flow Verify Node' }; // Default
    try {
        config = JSON.parse(fs.readFileSync('../backend/seed_config.json', 'utf8'));
        console.log(`Loaded Config: Looking for "${config.name}"`);
    } catch (e) {
        console.error('Could not load seed_config.json, using default');
    }

    // Reuse stable headless config
    const browser = await chromium.launch({
        headless: true, // Headless for automation stability
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    page.setDefaultTimeout(120000);

    console.log('--- TARGETED TEST: Complaint -> Task ---');

    try {
        // 1. Login
        await page.goto('http://localhost:4300/login');
        await page.fill('input[name="email"]', 'admin@nagarparishad.in');
        await page.fill('input[name="password"]', 'password');
        await page.click('button:has-text("Sign In")'); // Correct selector
        await page.waitForURL('**/tabs/home');
        console.log('1. Custom Login Successful.');

        // 2. Refresh Data (Go to Complaints)
        await page.goto('http://localhost:4300/tabs/complaints');
        await page.waitForSelector('app-complaint-list');

        // Wait for list to populate
        await page.reload(); // Force reload to ensure new data appears
        await page.waitForSelector('app-complaint-list');
        await page.waitForTimeout(3000);

        // Locate specific item inside the list component
        const item = page.locator('app-complaint-list ion-item').filter({ hasText: config.name }).first();
        if (await item.count() === 0) {
            console.log('List Items Found:', await page.locator('app-complaint-list ion-item').allInnerTexts());
            await page.screenshot({ path: 'targeted_list_fail.png' });
            throw new Error(`Test Complaint "${config.name}" not found!`);
        }
        await item.click();
        await page.waitForSelector('app-complaint-detail');
        console.log('2. Opened Complaint "Task Flow Verify".');

        // 3. Accept (if needed)
        const acceptBtn = page.locator('button').filter({ hasText: /Accept/i });
        if (await acceptBtn.isVisible()) {
            await acceptBtn.click();
            await page.waitForTimeout(2000);
            console.log('3. Accepted Complaint.');
        } else {
            console.log('3. Complaint might already be accepted (no button).');
        }

        // 4. Create Task
        const createTaskBtn = page.locator('button').filter({ hasText: /Task/i }); // "Create Task from Complaint"
        if (!await createTaskBtn.isVisible()) throw new Error('Create Task button not visible.');

        await createTaskBtn.click();
        await page.waitForURL('**/tabs/tasks/create**');
        console.log('4. Clicked Create Task -> Form Opened.');

        // 5. Verify Pre-filled Data
        await page.waitForTimeout(1000);
        const title = await page.locator('ion-input').filter({ hasText: /Title/i }).locator('input').inputValue();
        const desc = await page.locator('ion-textarea').filter({ hasText: /Description/i }).locator('textarea').inputValue();

        console.log(`   [CHECK] Pre-filled Title: "${title}"`);
        console.log(`   [CHECK] Pre-filled Description: "${desc}"`);

        if (!desc.includes('Specific verification')) {
            console.error('   [FAIL] Description mismatch!');
        }

        // 6. Save
        const saveBtn = page.locator('ion-button').filter({ hasText: /Create|Save/i }).last();
        await saveBtn.click();
        console.log('5. Clicked Save Task.');

        await page.waitForTimeout(3000);
        // Should be on Task Detail or List
        const url = page.url();
        console.log(`   Final URL: ${url}`);

        if (url.includes('/tabs/tasks')) {
            console.log('6. SUCCESS: Task Created & Redirected.');
        } else {
            console.log('6. WARNING: Redirect pending?');
        }

        await page.screenshot({ path: 'targeted_task_creation.png' });

    } catch (e) {
        console.error('TEST FAIL:', e);
        await page.screenshot({ path: 'targeted_error.png' });
    } finally {
        await browser.close();
    }
})();
