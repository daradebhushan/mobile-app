const { chromium } = require('playwright');
const path = require('path');

const outDir = 'C:\\\\Users\\\\darad\\\\.gemini\\\\antigravity\\\\brain\\\\daf2ab4c-5215-4193-9392-f1bbe016b45d';

const webAliasTest = async () => {
    console.log('Starting Web UI + Alias Registration Test...');
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

        console.log('3. Opening Add user modal...');
        await page.locator('button.fixed.bottom-24.right-4').click();
        await page.waitForTimeout(1000);

        // Testing the precise user email: daradebhushan15+456@gmail.com
        const targetEmail = 'daradebhushan15+456@gmail.com';

        await page.fill('input[formControlName="name"]', 'Alias Testing User');
        await page.fill('input[formControlName="email"]', targetEmail);
        await page.fill('input[formControlName="mobile"]', '7777777777');

        // Optional fields
        await page.selectOption('select[formControlName="role"]', 'STAFF');
        await page.fill('input[formControlName="designation"]', 'Alias Staff');

        console.log('4. Clicking Save & Capturing Validation State...');
        await page.locator('button', { hasText: 'Save' }).click();
        await page.waitForTimeout(2500); // Wait for API response or form validation error

        // Look for error banner
        const errorBanner = page.locator('.bg-red-50');
        if (await errorBanner.count() > 0) {
            const errorText = await errorBanner.innerText();
            console.log('Validation Error Caught:', errorText);
            await page.screenshot({ path: path.join(outDir, `web_alias_validation_error.png`) });
        } else {
            console.log('No error banner found. User created successfully?');
            await page.screenshot({ path: path.join(outDir, `web_alias_success.png`) });
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await browser.close();
    }
};

webAliasTest();
