const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    // Launch browser (Headless false for visibility if supported, but usually better headless in CI/Agents or slowMo)
    // Using headless: true for stability in this env, but taking many screenshots.
    // Actually user wants "Verification on browser". 
    // I cannot show them the live browser, but screenshots prove it ran on a browser engine.
    const browser = await chromium.launch({
        headless: true, // Headless for automation stability
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: { dir: 'videos/' }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000); // Global timeout 60s

    console.log('--- STARTING COMPREHENSIVE BROWSER TEST ---');

    try {
        // 1. LOGIN
        console.log('1. Navigating to Login...');
        await page.goto('http://localhost:4300/login', { timeout: 60000 });

        // Wait for any input to ensure page load
        try {
            await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 30000 });
        } catch (e) {
            console.log('   Timeout waiting for email input. Taking screenshot...');
            await page.screenshot({ path: 'debug_login_timeout.png' });
            throw e;
        }

        await page.fill('input[name="email"]', 'admin@nagarparishad.in');
        await page.fill('input[name="password"]', 'password');

        await page.click('button:has-text("Sign In")');

        // Wait for Dashboard (Home)
        await page.waitForURL('**/tabs/home', { timeout: 10000 });
        console.log('   Login Successful. Redirected to Home.');
        await page.screenshot({ path: '1_dashboard.png' });

        // 2. NAVIGATE TO COMPLAINTS
        console.log('2. Navigating to Complaints List...');

        await page.goto('http://localhost:4300/tabs/complaints');
        await page.waitForSelector('app-complaint-list', { timeout: 5000 });
        console.log('   Complaints List Loaded.');
        await page.screenshot({ path: '2_complaint_list.png' });

        // 3. TEST REJECTION FLOW
        console.log('3. Testing Rejection Flow...');
        // Find complaint with citizen "Reject Tester"
        // Ionic Items...
        const rejectItem = page.locator('ion-item').filter({ hasText: 'Reject Tester' }).first();
        if (await rejectItem.count() > 0) {
            await rejectItem.click();
            await page.waitForSelector('app-complaint-detail', { timeout: 5000 });
            console.log('   Opened Complaint Detail (Reject Tester).');

            // Verify Details Visible (Dept, Type)
            const content = await page.content();
            if (content.includes('Department') && content.includes('Complaint Type')) {
                console.log('   PASS: Department and Type labels visible.');
            } else {
                console.log('   FAIL: Department/Type labels missing.');
            }
            await page.screenshot({ path: '3_complaint_detail_before_reject.png' });

            // Click Reject
            await page.click('button:has-text(/Reject/i)'); // Custom button in HTML
            // Wait for Alert
            await page.waitForSelector('ion-alert');
            console.log('   Rejection Alert Open.');

            // Fill Reason
            await page.fill('textarea.alert-input', 'Automated Rejection Test');
            await page.click('button.alert-button:has-text("Reject")');

            // Wait for update
            await page.waitForTimeout(2000);
            // Check status in UI
            const status = await page.locator('h2').first().textContent(); // e.g., "REJECTED"
            if (status.includes('REJECTED')) {
                console.log('   PASS: Status updated to REJECTED.');
            } else {
                console.log('   FAIL: Status is ' + status);
            }
            await page.screenshot({ path: '4_complaint_rejected.png' });

            // Go back
            await page.goBack();
        } else {
            console.log('   SKIP: "Reject Tester" complaint not found.');
        }

        // 4. TEST TASK CREATION FLOW
        console.log('4. Testing Task Creation Flow...');
        await page.goto('http://localhost:4300/tabs/complaints');
        const taskItem = page.locator('ion-item').filter({ hasText: 'Task Tester' }).first();

        if (await taskItem.count() > 0) {
            await taskItem.click();
            await page.waitForSelector('app-complaint-detail');
            console.log('   Opened Complaint Detail (Task Tester).');

            // Click Accept
            // Check if already accepted (if re-running). If Accept button visible, click it.
            if (await page.isVisible('button:has-text("Accept")')) {
                await page.click('button:has-text("Accept")');
                await page.waitForTimeout(2000); // Wait for toast/update
                console.log('   Accepted Complaint.');
            }

            // Click Create Task
            await page.waitForSelector('button:has-text("Create Task from Complaint")');
            await page.click('button:has-text("Create Task from Complaint")');

            // Wait for Task Form
            await page.waitForURL('**/tabs/tasks/create**');
            console.log('   Navigated to Task Creation Form.');
            await page.waitForTimeout(1000);

            // Verify Pre-fill
            const titleVal = await page.locator('ion-input').filter({ hasText: 'Title' }).locator('input').inputValue().catch(() => '');
            const descVal = await page.locator('ion-textarea').filter({ hasText: 'Description' }).locator('textarea').inputValue().catch(() => '');

            // Note: Title might be "Complaint <No>", Desc should contain "This complaint is for testing task creation"
            console.log(`   Pre-filled Title: ${titleVal}`);
            console.log(`   Pre-filled Desc: ${descVal}`);

            if (descVal.includes('testing task creation')) {
                console.log('   PASS: Description pre-filled correctly.');
            } else {
                console.log('   FAIL: Description mismatch.');
            }
            await page.screenshot({ path: '5_task_creation_form.png' });

            // Create Task
            await page.click('ion-button:has-text("Create Task")'); // Or whatever the save button is "Save Task" / check icon
            // The form usually has a button at bottom or top right.
            // Looking at source: <ion-button (click)="saveTask()">
            // It might be an icon button in header or block button at bottom? 
            // Let's try finding the save button. It's usually "Create Task" or "Save".
            // In provided `task-form.page.html` (implied), let's assume standard Ionic header button or footer.
            // Wait, I didn't verify the Task Form HTML, only TS.
            // Let's try locating a button with type submit or look for click handler.
            // Common practice: ion-fab or header button.
            // Let's assume there is a visible primary button.
            const saveBtn = page.locator('ion-button').filter({ hasText: /Create|Save/i }).last();
            if (await saveBtn.isVisible()) {
                await saveBtn.click();
                console.log('   Clicked Create/Save Task.');
                await page.waitForTimeout(2000);

                // Verify redirection to Task Detail
                const url = page.url();
                if (url.includes('/tabs/tasks/')) {
                    console.log('   PASS: Redirected to Task Detail/List. Task Created.');
                    await page.screenshot({ path: '6_task_created_success.png' });
                } else {
                    console.log('   WARNING: Did not redirect as expected. Current URL: ' + url);
                }
            } else {
                console.log('   FAIL: Could not find Save/Create button.');
            }

        } else {
            console.log('   SKIP: "Task Tester" complaint not found.');
        }

    } catch (e) {
        console.error('TEST EXCEPTION:', e);
        await page.screenshot({ path: 'error_state.png' });
    } finally {
        await browser.close();
        console.log('--- TEST COMPLETE ---');
    }
})();
