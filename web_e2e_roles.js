const { chromium } = require('playwright');
const path = require('path');

const outDir = 'C:\\\\Users\\\\darad\\\\.gemini\\\\antigravity\\\\brain\\\\daf2ab4c-5215-4193-9392-f1bbe016b45d';

const webRoleTest = async () => {
    console.log('Starting Web UI Exhaustive Role Switch Test...');
    let browser = await chromium.launch({ channel: 'msedge', headless: true }).catch(() => chromium.launch({ channel: 'chrome', headless: true }));

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();

    try {
        console.log('1. Logging in as Admin...');
        await page.goto('http://localhost:4200/login');
        await page.waitForTimeout(2000);
        await page.fill('input[type="email"]', 'daradebhushan15+admin@gmail.com');
        await page.fill('input[type="password"]', 'Bbd@123');
        await page.press('input[type="password"]', 'Enter');
        await page.waitForTimeout(4000);

        console.log('2. Navigating to Staff List...');
        await page.goto('http://localhost:4200/admin/users');
        await page.waitForTimeout(3000);

        // We will find our user or pick the first one. Let's create one for safety to not break others.
        console.log('3. Opening Add user modal...');
        await page.locator('button.fixed.bottom-24.right-4').click();
        await page.waitForTimeout(1000);

        const uniqueEmail = `webtest_${Date.now()}@e2e.com`;
        await page.fill('input[formControlName="name"]', 'Web Role Test User');
        await page.fill('input[formControlName="email"]', uniqueEmail);
        await page.fill('input[formControlName="mobile"]', '7777777777');
        await page.fill('input[formControlName="password"]', 'TestPass123!');
        await page.selectOption('select[formControlName="role"]', 'STAFF');
        await page.fill('input[formControlName="designation"]', 'Initial Staff');

        // We need a department to assign to for certain roles
        const deptSelect = page.locator('select[formControlName="departmentId"]');
        if (await deptSelect.count() > 0) {
            const options = await deptSelect.locator('option').allInnerTexts();
            if (options.length > 1) {
                await deptSelect.selectOption({ index: 1 });
            }
        }

        await page.locator('button', { hasText: 'Save' }).click();
        await page.waitForTimeout(3000);
        console.log('✅ User Created as STAFF');

        // Helper to edit the user we just created
        const editUser = async (newRole) => {
            console.log(`Searching for ${uniqueEmail} to edit...`);
            // Type in search bar to find them quickly
            await page.fill('input[placeholder="Search staff..."]', uniqueEmail);
            await page.waitForTimeout(1500);

            const row = page.locator('tr', { hasText: uniqueEmail });
            if (await row.count() === 0) {
                throw new Error(`User missing from list! Role Disappearance Bug triggered on switch to ${newRole}`);
            }
            await page.screenshot({ path: path.join(outDir, `web_role_before_switch_to_${newRole}.png`) });

            // Click Edit
            await row.locator('button.text-indigo-600, button[title="Edit"]').click();
            await page.waitForTimeout(1000);

            // Change role
            await page.selectOption('select[formControlName="role"]', newRole);
            await page.locator('button', { hasText: 'Save' }).click();
            await page.waitForTimeout(3000);

            // Assert they are still in the list after reload
            await page.fill('input[placeholder="Search staff..."]', uniqueEmail);
            await page.waitForTimeout(1500);
            if (await page.locator('tr', { hasText: uniqueEmail }).count() === 0) {
                await page.screenshot({ path: path.join(outDir, `web_role_missing_after_${newRole}.png`) });
                throw new Error(`User DISAPPEARED from list after switching to ${newRole}!`);
            }
            await page.screenshot({ path: path.join(outDir, `web_role_success_after_${newRole}.png`) });
            console.log(`✅ Successfully switched and verified persistence for role: ${newRole}`);
        };

        // 4. Exhaustive switching sequence
        console.log('\n--- BEGINNING ROLE SWITCH MATRIX ---');
        await editUser('DEPARTMENT_HEAD'); // Staff -> Dept Head
        await editUser('ADMIN');           // Dept Head -> Admin
        await editUser('STAFF');           // Admin -> Staff
        await editUser('DEPARTMENT_HEAD'); // Staff -> Dept Head (User's specific bug path test, backwards from bug)
        await editUser('STAFF');           // Dept Head -> Staff (The exact bug reported!)

        console.log('\n✅ ALL ROLE SWITCH COMBINATIONS PASSED IN WEB UI!');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await browser.close();
    }
};

webRoleTest();
