const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4200/login');
    await page.waitForTimeout(2000);
    await page.locator('input[type="email"]').fill('daradebhushan15@gmail.com');
    await page.locator('input[type="password"]').fill('Bbd@1415');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    try {
        await page.click('text="Admin"', { timeout: 2000 });
        await page.click('button:has-text("Continue")', { timeout: 2000 });
    } catch (e) { }
    await page.waitForTimeout(2000);

    page.on('request', request => {
        if (request.url().includes('/api/admin/users/') && request.method() === 'PUT') {
            console.log('PUT Request Payload:', request.postData());
        }
    });

    page.on('response', async response => {
        if (response.url().includes('/api/admin/users/') && response.request().method() === 'PUT') {
            const body = await response.text();
            console.log('PUT Response Status:', response.status());
            console.log('PUT Response Body:', body);
        }
    });

    await page.goto('http://127.0.0.1:4200/tabs/admin/users/105');
    await page.waitForTimeout(3000);

    // Select STAFF
    await page.select('select[name="role"]', 'STAFF');
    await page.waitForTimeout(1000);

    // Evaluate click instead of relying on a selector that might time out
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Update Employee'));
        if (btn) btn.click();
    });

    await page.waitForTimeout(3000);
    await browser.close();
})();
