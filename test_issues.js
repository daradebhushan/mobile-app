const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = './test-results';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const testIssues = async () => {
    console.log('Starting Mobile E2E Test to trace errors...');
    let browser = await chromium.launch({ channel: 'msedge', headless: true }).catch(() => chromium.launch({ channel: 'chrome', headless: true }));

    const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await ctx.newPage();

    page.on('response', response => {
        if (response.status() >= 400 && response.url().includes('townseva.in')) {
            console.log(`[HTTP ERROR] ${response.status()} ${response.url()}`);
        }
    });

    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[CONSOLE ERROR] ${msg.text()}`);
    });

    try {
        console.log('1. Logging in...');
        await page.goto('http://localhost:4200/login');
        await page.waitForTimeout(2000);
        
        // Sometimes ionic takes a moment to render inputs
        await page.fill('input[type="email"], ion-input[type="email"] input', 'bhagyashreekale1508@gmail.com');
        await page.fill('input[type="password"], ion-input[type="password"] input', 'Bbd@1415');
        
        // Wait and click sign in
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('ion-button'));
            const signInBtn = btns.find(b => b.innerText.toLowerCase().includes('sign in'));
            if (signInBtn) signInBtn.click();
        });

        console.log('2. Waiting for Dashboard...');
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(outDir, '01_dashboard.png') });

        console.log('3. Navigating to Tasks...');
        await page.goto('http://localhost:4200/owner/tasks'); 
        // wait, let's just click the menu items
        await page.evaluate(() => {
           let menuItems = Array.from(document.querySelectorAll('ion-item'));
           let taskMenu = menuItems.find(m => m.innerText.toLowerCase().includes('task'));
           if (taskMenu) taskMenu.click();
        });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, '02_tasks.png') });
        
        console.log('4. Navigating to Departments...');
        await page.goto('http://localhost:4200/owner/departments');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, '03_departments.png') });
        
        console.log('5. Navigating to Users/Staff...');
        await page.goto('http://localhost:4200/owner/users');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, '04_users.png') });

        console.log('Test completed.');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await browser.close();
    }
};

testIssues();
