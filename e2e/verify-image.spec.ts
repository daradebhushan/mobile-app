import { test, expect } from '@playwright/test';

test('verify complaint image loads', async ({ page }) => {
    // 1. Go to app
    console.log('Navigating to app (localhost:8102)...');
    await page.goto('http://localhost:8102/login');

    // 2. Login
    console.log('Attempting login...');
    await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 10000 });
    await page.fill('input[name="email"]', 'owner@govt.in');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // 3. Wait for Dashboard
    console.log('Waiting for dashboard...');
    try {
        await page.waitForURL(/\/(home|dashboard)/, { timeout: 20000 });
    } catch (e) {
        console.log('Timeout waiting for dashboard. Checking for error message...');
        try {
            const errorText = await page.locator('.bg-red-50').textContent({ timeout: 2000 });
            console.log('UI ERROR MESSAGE:', errorText?.trim());
        } catch (err) {
            console.log('No error message found on screen.');
        }
        await page.screenshot({ path: 'login-failed-ngrok.png', fullPage: true });
        throw e;
    }

    // 4. Navigate to Complaint
    console.log('Navigating to complaint detail...');
    await page.goto('http://localhost:8102/tabs/complaints');

    // Wait for list to load
    await page.waitForSelector('.glass-card', { timeout: 15000 });

    // Click the first complaint item
    const firstComplaint = page.locator('.glass-card').first();
    await firstComplaint.click();

    // 5. Verify Image Loading in Detail Page
    console.log('Verifying image in detail page...');

    // Wait for loading spinner to disappear
    await page.waitForSelector('ion-spinner', { state: 'hidden', timeout: 10000 }).catch(() => console.log('Spinner not found or already gone'));

    // Check for the main image container or error state
    const image = page.locator('.rounded-2xl.overflow-hidden img');
    const errorState = page.locator('ion-icon[name="alert-circle-outline"]');

    if (await errorState.isVisible()) {
        throw new Error('Complaint failed to load (Error State visible)');
    }

    await expect(image).toBeVisible({ timeout: 10000 });

    // Check if src is a blob url
    const src = await image.getAttribute('src');
    console.log('Image Source:', src);

    if (!src || (!src.startsWith('blob:') && !src.startsWith('http'))) {
        throw new Error(`Image source looks invalid: ${src}`);
    }

    console.log('Image verification successful!');
});
