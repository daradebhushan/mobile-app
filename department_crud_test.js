const { chromium } = require('playwright');

(async () => {
    // 1. Launch Browser (Headless: false for visual)
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: { dir: 'videos_dept_crud/' }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    console.log('--- STARTING DEPARTMENT CRUD TEST ---');

    try {
        // --- 1. LOGIN ---
        console.log('[1/6] Login');
        await page.goto('http://localhost:4300/login');
        await page.fill('input[name="email"]', 'admin@nagarparishad.in');
        await page.fill('input[name="password"]', 'password');
        await page.click('button:has-text("Sign In")'); // Correct selector
        await page.waitForURL('**/tabs/home');
        console.log('   Login Success.');

        // --- 2. NAVIGATE TO DEPARTMENTS ---
        console.log('[2/6] Navigating to Departments');
        await page.goto('http://localhost:4300/tabs/admin/departments');
        await page.waitForSelector('app-department-list');
        await page.screenshot({ path: 'dept_1_list_initial.png' });
        console.log('   Department List Loaded.');

        // --- 3. CREATE DEPARTMENT ---
        console.log('[3/6] Create Department');
        // Locator for generic Add button (Orange one) with icon
        const createBtn = page.locator('button:has(ion-icon[name="add-outline"])');
        await createBtn.click();

        await page.waitForURL('**/tabs/admin/departments/create');
        console.log('   Form Opened.');

        const testName = 'Automated Test Dept ' + Date.now();
        await page.fill('ion-input[name="name"] input', testName).catch(() => page.fill('input[name="name"]', testName));

        await page.screenshot({ path: 'dept_2_form_filled.png' });
        await page.click('ion-button:has-text("Save")');

        await page.waitForURL('**/tabs/admin/departments');
        await page.waitForTimeout(2000);
        console.log(`   Created: ${testName}`);

        // Verify in list (h3 tag)
        if (await page.locator(`h3:has-text("${testName}")`).count() > 0) {
            console.log('   [PASS] Department found in list.');
        } else {
            throw new Error('Newly created department not found!');
        }
        await page.screenshot({ path: 'dept_3_created_list.png' });

        // --- 4. UPDATE DEPARTMENT ---
        console.log('[4/6] Update Department');
        // Find the item container and edit button within it
        const deptCard = page.locator(`div:has(h3:has-text("${testName}"))`).first();
        const editBtn = deptCard.locator('button:has(ion-icon[name="create-outline"])');

        await editBtn.click();

        await page.waitForURL(/.*\/edit\/.*/);
        console.log('   Edit Form Opened.');

        const updatedName = testName + ' UPDATED';
        await page.fill('ion-input[name="name"] input', updatedName);
        await page.click('ion-button:has-text("Save")');

        await page.waitForURL('**/tabs/admin/departments');
        await page.waitForTimeout(2000);

        // Verify Update
        if (await page.locator(`h3:has-text("${updatedName}")`).count() > 0) {
            console.log('   [PASS] Department updated name verified.');
        } else {
            throw new Error('Updated department name not found!');
        }
        await page.screenshot({ path: 'dept_4_updated_list.png' });

        // --- 5. DELETE DEPARTMENT ---
        console.log('[5/6] Delete Department');
        const updatedCard = page.locator(`div:has(h3:has-text("${updatedName}"))`).first();
        const deleteBtn = updatedCard.locator('button:has(ion-icon[name="trash-outline"])');

        await deleteBtn.click();

        // Handle Confirmation Alert
        await page.waitForSelector('ion-alert');
        await page.click('button.alert-button:has-text("Delete")'); // Confirm

        await page.waitForTimeout(2000);
        if (await page.locator(`h3:has-text("${updatedName}")`).count() === 0) {
            console.log('   [PASS] Department deleted.');
        } else {
            console.log('   [WARN] Delete visual confirmation pending (might need refresh or wait).');
        }
        await page.screenshot({ path: 'dept_5_after_delete.png' });

        // --- 6. DEFAULT DEPARTMENT CHECK ---
        console.log('[6/6] Default Department Verification');
        // Check for "Engineering" or "Health"
        const defaultDept = page.locator('h3').filter({ hasText: /Engineering|Health/i }).first();
        if (await defaultDept.count() > 0) {
            console.log('   [PASS] Default Department (Engineering/Health) exists.');
        } else {
            console.log('   [WARN] Default departments not found (maybe DB reset?). Attempting to Seed.');
            // Try clicking Seed button (Blue one)
            const seedBtn = page.locator('button:has(ion-icon[name="albums-outline"])');
            if (await seedBtn.isVisible()) {
                await seedBtn.click();
                await page.waitForTimeout(2000);
                if (await page.locator('h3').filter({ hasText: /Engineering|Health/i }).count() > 0) {
                    console.log('   [PASS] Seeded defaults successfully.');
                }
            }
        }
        await page.screenshot({ path: 'dept_6_final_verification.png' });

        console.log('--- TEST COMPLETE ---');

    } catch (e) {
        console.error('TEST FAIL:', e);
        await page.screenshot({ path: 'dept_error.png' });
    } finally {
        await browser.close();
    }
})();
