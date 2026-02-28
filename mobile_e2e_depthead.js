const { chromium } = require('playwright');
const path = require('path');

const outDir = 'C:\\\\Users\\\\darad\\\\.gemini\\\\antigravity\\\\brain\\\\daf2ab4c-5215-4193-9392-f1bbe016b45d';

const testDeptHead = async () => {
    console.log('Starting Full Mobile E2E Test as Department Head...');
    let browser = await chromium.launch({ channel: 'msedge', headless: true }).catch(() => chromium.launch({ channel: 'chrome', headless: true }));

    const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await ctx.newPage();

    try {
        console.log('1. Logging in...');
        await page.goto('http://localhost:8100/login');
        await page.waitForTimeout(2000);
        const isRolePage = await page.evaluate(() => document.body.innerText.includes('Select Your Role'));
        if (isRolePage) {
            const roleCard = await page.locator('ion-card', { hasText: 'Department Head' });
            if (await roleCard.count() > 0) await roleCard.first().click();
            await page.locator('ion-button', { hasText: 'Continue' }).click();
            await page.waitForTimeout(1000);
        }

        await page.fill('input[type="email"], ion-input[type="email"] input', 'depthead@e2etesting.com');
        await page.fill('input[type="password"], ion-input[type="password"] input', 'Password123!');
        await page.press('input[type="password"], ion-input[type="password"] input', 'Enter');

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('ion-button'));
            const signInBtn = btns.find(b => b.innerText.toLowerCase().includes('sign in'));
            if (signInBtn) signInBtn.click();
        });

        console.log('2. Verifying Dept Head Dashboard...');
        await page.waitForTimeout(4000);
        await page.screenshot({ path: path.join(outDir, 'mobile_dept_head_01_dashboard.png') });

        console.log('3. Navigating to Complaints (Isolated)...');
        await page.goto('http://localhost:8100/complaints');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, 'mobile_dept_head_02_complaints.png') });

        console.log('4. Navigating to Tasks (Isolated)...');
        await page.goto('http://localhost:8100/tasks');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, 'mobile_dept_head_03_tasks.png') });

        console.log('5. Navigating to Users/Staff (Isolated)...');
        await page.goto('http://localhost:8100/users');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, 'mobile_dept_head_04_users.png') });

        console.log('✅ ALL DEPT HEAD E2E SCENARIOS CAPTURED!');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await browser.close();
    }
};

testDeptHead();
