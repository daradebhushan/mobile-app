import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Simulate Missing Content-Type Header for Images', async ({ page }) => {
    // 0a. Mock Complaint LIST to ensure we have item to click
    await page.route('**/api/admin/complaints', async route => {
        // Only mock plain GET list, not filtered if possible, or just catch all
        // This returns a Page<ComplaintDTO> or List<ComplaintDTO> depending on backend.
        // Angular service expects: Observable<any> which is likely the list or object.
        // Based on ComplaintService.ts: return this.http.get<any>(`${this.apiUrl}`); -> List<DTO>

        const mockList = [{
            id: 1,
            complaintNo: 'CMP-MOCK-001',
            citizenName: 'Sim Citizen',
            departmentName: 'Test Dept',
            description: 'Simulation Complaint',
            status: 'PENDING',
            createdAt: new Date().toISOString()
        }];

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockList)
        });
    });

    // 0b. Mock Complaint DETAILS (for ID 1)
    await page.route('**/api/admin/complaints/1', async route => {
        const mockDetail = {
            id: 1,
            complaintNo: 'CMP-MOCK-001',
            citizenName: 'Sim Citizen',
            description: 'Simulation Complaint',
            status: 'PENDING',
            attachments: [{
                id: 999,
                fileName: 'simulated_image.jpg',
                fileType: 'image/jpeg',
                filePath: 'uploads/fake.jpg'
            }]
        };

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockDetail)
        });
    });

    // 1. Mock/Intercept Image Downloads
    await page.route('**/attachments/*/download', async route => {
        // Serve a simple 1x1 pixel red dot or similar as the image body
        // This avoids needing a real file fetch
        const pixelBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

        console.log('INTERCEPT: Serving image without Content-Type header to simulate backend issue.');

        await route.fulfill({
            status: 200,
            body: pixelBuffer,
            headers: {
                // Intentionally NO 'content-type'
                'content-length': pixelBuffer.length.toString()
            }
        });
    });

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    // 2. Login
    await page.goto('http://localhost:8100/login');
    await page.fill('input[name="email"]', 'admin@nagarparishad.in');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/tabs/home');

    // 3. Go to Complaints and Open First One
    await page.goto('http://localhost:8100/tabs/complaints');
    await page.waitForSelector('ion-item');
    await page.locator('ion-item').first().click();
    await page.waitForSelector('app-complaint-detail');

    // 4. Verify Image Visibility
    // With my fix (Force Blob), the image SHOULD be visible even without the header.
    // Without the fix, this test would fail/show broken image.
    await page.waitForSelector('.overflow-x-auto img');

    // Check first image
    const img = page.locator('.overflow-x-auto img').first();
    const isVisible = await img.isVisible();
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);

    console.log(`Simulation Result -> Visible: ${isVisible}, NaturalWidth: ${naturalWidth}`);

    if (naturalWidth > 0) {
        console.log('SUCCESS: Frontend successfully handled the missing Content-Type header!');
        await page.screenshot({ path: 'd:/anti gravity/mobile/simulation_success.png', fullPage: true });
    } else {
        console.log('FAILURE: Image failed to render. Frontend fix is seemingly ineffective.');
        await page.screenshot({ path: 'd:/anti gravity/mobile/simulation_failure.png', fullPage: true });
        throw new Error('Image failed to render in simulation.');
    }
});
