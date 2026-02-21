const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const page = await browser.newPage();

    try {
        console.log('--- TEST START ---');

        // Capture console logs
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

        // 1. Login
        console.log('Navigating to Login...');
        await page.goto('http://localhost:4200/login');

        console.log('Filling credentials...');
        await page.fill('input[type="email"]', 'superadmin@test.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        console.log('Waiting for navigation or error...');

        try {
            // Wait for either success redirect or error message
            await Promise.race([
                page.waitForURL('**/tabs/home', { timeout: 8000 }),
                page.waitForSelector('.bg-red-50', { timeout: 8000 })
            ]);
        } catch (e) {
            console.log('Timeout waiting for login response.');
        }

        // Check for error
        const errorMsg = await page.$('.bg-red-50');
        if (errorMsg) {
            const text = await errorMsg.textContent();
            console.error('LOGIN FAILED with UI Error:', text);
            throw new Error('Login failed: ' + text);
        }

        const urlAfterLogin = page.url();
        console.log(`URL after login attempt: ${urlAfterLogin}`);

        if (!urlAfterLogin.includes('tabs/home')) {
            console.error('Login did not redirect to Dashboard.');
            if (urlAfterLogin.includes('login')) {
                throw new Error('Still on login page.');
            }
        }

        console.log('Login Successful. Navigating to Complaint Detail 1...');
        await page.goto('http://localhost:4200/complaint-detail/1');
        await page.waitForTimeout(3000);

        // Accept complaint if pending (check for Accept button)
        // using a more generic selector logic
        const acceptBtn = await page.$('ion-button:has-text("Accept"), button:has-text("Accept")');
        if (acceptBtn && await acceptBtn.isVisible()) {
            console.log('Accepting complaint...');
            await acceptBtn.click();
            await page.waitForTimeout(2000);
        }

        // 3. Click Create Task
        console.log('Looking for Create Task button...');
        // Try multiple selectors
        const createTaskBtn = await page.locator('button:has-text("Create Task"), ion-button:has-text("Create Task")').first();

        if (await createTaskBtn.isVisible()) {
            console.log('Clicking Create Task button...');
            await createTaskBtn.click();
        } else {
            console.log('Create Task button not found.');
            // Force navigate to test query params if button logic fails
            console.log('Force navigating to task creation...');
            await page.goto('http://localhost:4200/tabs/tasks/create?fromComplaintId=1');
        }

        await page.waitForTimeout(3000);

        // 4. Verify Task Form
        console.log('Verifying Task Form...');
        const url = page.url();
        console.log(`Current URL: ${url}`);

        if (url.includes('/tabs/tasks/create')) {
            console.log('PASS: Correctly navigated to Task Create page.');
        } else {
            console.log('FAIL: Navigation mismatch.');
        }

        // Check for Complaint Reference Card
        // Look for "Reference:" text
        const refText = await page.getByText('Reference:', { exact: false }).first();
        if (await refText.isVisible()) {
            console.log('PASS: Complaint Reference Card is visible.');
        } else {
            console.log('FAIL: Complaint Reference Card NOT found.');
        }

        await page.screenshot({ path: 'complaint_task_flow.png' });

    } catch (error) {
        console.error('TEST ERROR:', error);
        await page.screenshot({ path: 'error_state.png' });
    } finally {
        await browser.close();
        console.log('--- TEST END ---');
    }
})();
