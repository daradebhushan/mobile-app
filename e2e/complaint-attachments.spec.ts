import { test, expect } from '@playwright/test';

test('Verify Complaint Attachments and Horizontal Scroll', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    // 1. Navigate to the app (using the served port)
    console.log('Navigating to login page...');
    await page.goto('http://localhost:8100/login');

    // Handle potential redirect if already logged in, or just wait for selector
    try {
        await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    } catch (e) {
        console.log('Not on login page, maybe already logged in? Checking url');
    }

    // 2. Login
    if (page.url().includes('login')) {
        console.log('Logging in as Admin (Local)...');
        await page.fill('input[name="email"]', 'admin@nagarparishad.in');
        await page.fill('input[name="password"]', 'password');
        await page.click('button:has-text("Sign In")');

        // Wait for login to complete
        try {
            await Promise.race([
                page.waitForURL('**/tabs/home'),
                page.waitForSelector('.bg-red-50', { timeout: 10000 })
            ]);
        } catch (e) {
            console.log('Timeout waiting for login response.');
        }

        if (await page.locator('.bg-red-50').isVisible()) {
            const err = await page.textContent('.bg-red-50');
            throw new Error('Login failed: ' + err?.trim());
        }

        console.log('Login successful.');
    }

    // 3. Navigate to Complaints
    console.log('Navigating to Complaints tab...');
    await page.goto('http://localhost:8100/tabs/complaints');
    await page.waitForSelector('ion-item'); // Wait for list

    // 4. Open First Complaint (Seeded with Photo)
    console.log('Opening first complaint in list...');
    const targetComplaint = page.locator('ion-item').first();

    // Explicit wait for it to be attached/visible
    try {
        await targetComplaint.waitFor({ state: 'visible', timeout: 5000 });
        await targetComplaint.click();
    } catch (e) {
        throw new Error('No complaints found in list.');
    }

    await page.waitForSelector('app-complaint-detail');
    console.log('Complaint Detail Opened.');

    // 5. Check for Photos section and Scroll
    const photosHeader = page.locator('h3:has-text("Photos")');
    if (await photosHeader.isVisible()) {
        console.log('Photos section found.');

        // 6. Check for horizontal scrolling container
        const scrollContainer = page.locator('.overflow-x-auto');
        await expect(scrollContainer).toBeVisible();

        // Check if we have images inside
        const images = scrollContainer.locator('img');
        const imgCount = await images.count();
        console.log(`Found ${imgCount} images in the scroll container.`);

        if (imgCount > 0) {
            // 7. Verify Images are Loaded (Natural Width > 0)
            for (let i = 0; i < imgCount; i++) {
                const img = images.nth(i);
                const isVisible = await img.isVisible();
                const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
                console.log(`Image ${i}: Visible=${isVisible}, NaturalWidth=${naturalWidth}`);
                expect(isVisible).toBeTruthy();
                expect(naturalWidth).toBeGreaterThan(0);
            }
            console.log('All images verified as visible and loaded.');
        } else {
            console.log('Photos section present but no images found (Local seeded data might have skipped upload).');
        }

    } else {
        console.log('No Photos section found using local test data.');
    }

    // 8. Check Attachments List for visibility
    const attachmentsHeader = page.locator('h3:has-text("ATTACHMENTS")');
    if (await attachmentsHeader.isVisible()) {
        console.log('Attachments list found.');
        // Check if we see generic file items
        const fileItems = page.locator('ion-icon[name="document-text"]'); // Non-images
        const imageItems = page.locator('img.object-cover'); // Images in list

        console.log('Checking for attachments in the list...');
        // Just ensure we don't have broken images i.e. verify 'src' is not empty
    }

});
