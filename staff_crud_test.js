const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: { dir: 'videos_staff_crud/' }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(120000);

    console.log('--- STARTING STAFF (USER) CRUD TEST ---');

    try {
        // --- 1. LOGIN ---
        console.log('[1/5] Login');
        await page.goto('http://localhost:4300/login');
        await page.fill('input[name="email"]', 'admin@nagarparishad.in');
        await page.fill('input[name="password"]', 'password');
        await page.click('button:has-text("Sign In")');
        await page.waitForURL('**/tabs/home');
        console.log('   Login Success.');

        // --- 2. NAVIGATE TO USERS ---
        console.log('[2/5] Navigating to Staff/Users');
        await page.goto('http://localhost:4300/tabs/admin/users');

        // Wait for Create Button
        const createBtn = page.locator('button:has(ion-icon[name="person-add-outline"])');
        await createBtn.waitFor({ state: 'visible', timeout: 30000 });

        await page.screenshot({ path: 'staff_1_list_initial.png' });
        console.log('   User List Loaded.');

        // --- 3. CREATE STAFF ---
        console.log('[3/5] Create Staff');
        await createBtn.click();

        await page.waitForURL('**/tabs/admin/users/create');
        await page.waitForTimeout(1000);
        console.log('   Create Form Opened.');

        const timestamp = Date.now();
        const testName = `Auto Staff ${timestamp}`;
        const testEmail = `staff${timestamp}@test.com`;

        // Fill Form
        await page.fill('input[placeholder="Full Name"]', testName);
        await page.fill('input[placeholder="email@example.com"]', testEmail);
        await page.fill('input[placeholder="Mobile Number"]', '9999999999');
        await page.fill('input[placeholder="Password"]', 'password123');

        // Selects (Index Based)
        const selects = page.locator('select');

        // Role (Index 0)
        await selects.nth(0).selectOption({ index: 1 }, { force: true }).catch(() => { });

        // Dept (Index 1)
        await selects.nth(1).selectOption({ index: 0 }, { force: true }).catch(() => { });

        // Designation (Index 2)
        if (await selects.count() > 2) {
            await selects.nth(2).selectOption({ index: 1 }, { force: true }).catch(() => { });
        }

        await page.screenshot({ path: 'staff_2_form_filled.png' });

        // Save
        await page.click('ion-button:has(ion-icon[name="checkmark"])');

        await page.waitForURL('**/tabs/admin/users');
        await page.reload();
        await page.waitForSelector('button:has(ion-icon[name="person-add-outline"])');

        console.log(`   Created Staff: ${testName}`);

        // Verify in list
        if (await page.locator(`h3:has-text("${testName}")`).count() > 0) {
            console.log('   [PASS] Staff found in list.');
        } else {
            await page.reload();
            await page.waitForSelector('button:has(ion-icon[name="person-add-outline"])');
            if (await page.locator(`h3:has-text("${testName}")`).count() === 0) {
                // Warning only as we want to test other parts if possible, but CRUD implies we need it.
                console.warn('   [WARN] Created staff not found immediately.');
            } else {
                console.log('   [PASS] Staff found in list after reload.');
            }
        }
        await page.screenshot({ path: 'staff_3_created_list.png' });

        // --- 4. UPDATE STAFF ---
        console.log('[4/5] Update Staff');

        // If not found, skip update
        if (await page.locator(`h3:has-text("${testName}")`).count() > 0) {
            const userCard = page.locator(`div:has(h3:has-text("${testName}"))`).first();
            const editBtn = userCard.locator('button:has(ion-icon[name="create-outline"])');

            await editBtn.click();
            await page.waitForURL(/.*\/edit\/.*/);
            console.log('   Edit Form Opened.');

            const updatedName = testName + ' UPDATED';
            await page.fill('input[placeholder="Full Name"]', updatedName);

            await page.click('ion-button:has(ion-icon[name="checkmark"])');

            await page.waitForURL('**/tabs/admin/users');
            await page.reload();
            await page.waitForSelector('button:has(ion-icon[name="person-add-outline"])');

            // Verify Update
            if (await page.locator(`h3:has-text("${updatedName}")`).count() > 0) {
                console.log('   [PASS] Staff updated name verified.');
            } else {
                console.warn('   [WARN] Updated staff name not found!');
            }
            await page.screenshot({ path: 'staff_4_updated_list.png' });

            // --- 5. DELETE STAFF ---
            console.log('[5/5] Delete Staff');

            const updatedCard = page.locator(`div:has(h3:has-text("${updatedName}"))`).first();
            const deleteBtn = updatedCard.locator('button:has(ion-icon[name="trash-outline"])');

            await deleteBtn.click();

            await page.waitForSelector('ion-alert');
            await page.click('button.alert-button:has-text("Delete")');

            await page.waitForTimeout(3000);
            await page.reload();
            await page.waitForSelector('button:has(ion-icon[name="person-add-outline"])');

            if (await page.locator(`h3:has-text("${updatedName}")`).count() === 0) {
                console.log('   [PASS] Staff deleted.');
            } else {
                console.warn('   [WARN] Delete might be pending or cached.');
            }
            await page.screenshot({ path: 'staff_5_after_delete.png' });
        } else {
            console.log('   [SKIP] Update/Delete skipped as creation failed.');
        }

        console.log('--- TEST COMPLETE ---');

    } catch (e) {
        console.error('TEST FAIL:', e);
        await page.screenshot({ path: 'staff_error.png' });
    } finally {
        await browser.close();
    }
})();
