const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4200/login');
    await page.fill('input[type="email"]', 'daradebhushan15@gmail.com');
    await page.fill('input[type="password"]', 'Bbd@1415');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    try {
        await page.click('text="Chief Officer"');
        await page.click('button:has-text("Continue")');
    } catch (e) { }
    await page.waitForTimeout(2000);

    // Setup network interceptor
    page.on('response', async response => {
        if (response.url().includes('/api/admin/users/') && response.request().method() === 'PUT') {
            console.log('PUT Response Status:', response.status());
            const text = await response.text();
            console.log('PUT Response Body:', text);
        }
    });

    page.on('request', async request => {
        if (request.url().includes('/api/admin/users/') && request.method() === 'PUT') {
            console.log('PUT Request Payload:', request.postData());
        }
    });

    // Go directly to the edit page for user 105
    await page.goto('http://127.0.0.1:4200/tabs/admin/users/105');
    await page.waitForTimeout(2000);

    // Change role
    await page.selectOption('select[name="role"]', 'STAFF');
    await page.waitForTimeout(1000);

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    await browser.close();
})();
