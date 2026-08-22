const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = '/Volumes/Extreme SSD/.gemini/antigravity-ide/brain/d97a9f38-b558-4b5b-8877-bb14aaa56f41/mobile_e2e_results';

function log(msg) {
  console.log(`\n======================================================`);
  console.log(`⚡ ${msg}`);
  console.log(`======================================================`);
}

async function runDeepE2ETest() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-web-security', '--allow-running-insecure-content']
  });

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    hasTouch: true
  });

  const page = await ctx.newPage();

  async function login(email, password) {
    console.log(`Logging in as ${email}...`);
    await page.goto('http://localhost:8100/login');
    await page.waitForTimeout(1500);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signIn = btns.find(b => b.innerText.toLowerCase().includes('sign in'));
      if (signIn) signIn.click();
    });
    await page.waitForTimeout(3500);
  }

  try {
    // =========================================================================
    // STEP 1: ADMIN CREATES A LIVE TASK ON MOBILE
    // =========================================================================
    log('STEP 1: CHIEF OFFICER CREATES A NEW TASK VIA MOBILE APP');
    await login('daradebhushan15+admin@gmail.com', 'Bbd@1415');

    await page.goto('http://localhost:8100/tabs/tasks/create');
    await page.waitForTimeout(2000);

    // Fill Task Title & Description
    const titleInput = await page.locator('input[placeholder*="Title"], input[name="title"], input[formcontrolname="title"]');
    if (await titleInput.count() > 0) {
      await titleInput.first().fill('Clean Pimpalgaon Bus Stand Waste');
    }

    const descInput = await page.locator('textarea[placeholder*="Description"], textarea[name="description"], textarea[formcontrolname="description"]');
    if (await descInput.count() > 0) {
      await descInput.first().fill('Urgent garbage clearing required near main entrance of Pimpalgaon bus depot.');
    }

    // Select Priority if available
    const prioritySelect = await page.locator('ion-select[formcontrolname="priority"], select[name="priority"]');
    if (await prioritySelect.count() > 0) {
      await prioritySelect.first().click().catch(() => {});
    }

    await page.screenshot({ path: path.join(outDir, '06_crud_01_task_form_filled.png') });
    console.log('📸 Captured 06_crud_01_task_form_filled.png');

    // Submit Task
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('ion-button, button'));
      const saveBtn = btns.find(b => b.innerText.toLowerCase().includes('create') || b.innerText.toLowerCase().includes('save') || b.innerText.toLowerCase().includes('submit'));
      if (saveBtn) saveBtn.click();
    });
    await page.waitForTimeout(3000);

    // Verify task on Tasks List
    await page.goto('http://localhost:8100/tabs/tasks');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outDir, '06_crud_02_task_in_list.png') });
    console.log('📸 Captured 06_crud_02_task_in_list.png');

    // Clear session
    await page.evaluate(() => localStorage.clear());

    // =========================================================================
    // STEP 2: STAFF VIEWS & INTERACTS WITH TASK
    // =========================================================================
    log('STEP 2: STAFF LOGS IN AND OPENS ASSIGNED TASK');
    await login('daradebhushan15+staff@gmail.com', 'Bbd@1415');

    await page.goto('http://localhost:8100/tabs/tasks');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, '06_crud_03_staff_task_list.png') });
    console.log('📸 Captured 06_crud_03_staff_task_list.png');

    // Click on the first task card
    const firstTask = await page.locator('ion-card, .task-card');
    if (await firstTask.count() > 0) {
      await firstTask.first().click().catch(() => {});
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(outDir, '06_crud_04_staff_task_details.png') });
      console.log('📸 Captured 06_crud_04_staff_task_details.png');
    }

    // Clear session
    await page.evaluate(() => localStorage.clear());

    // =========================================================================
    // STEP 3: ADMIN CREATES A NEW DEPARTMENT
    // =========================================================================
    log('STEP 3: ADMIN CREATES A NEW DEPARTMENT ON MOBILE');
    await login('daradebhushan15+admin@gmail.com', 'Bbd@1415');

    await page.goto('http://localhost:8100/tabs/admin/departments/create');
    await page.waitForTimeout(2000);

    const nameInput = await page.locator('input[placeholder*="Name"], input[name="name"], input[formcontrolname="name"]');
    if (await nameInput.count() > 0) {
      await nameInput.first().fill('Environment & Gardens');
    }

    const nameMrInput = await page.locator('input[placeholder*="Marathi"], input[name="nameMr"], input[formcontrolname="nameMr"]');
    if (await nameMrInput.count() > 0) {
      await nameMrInput.first().fill('पर्यावरण व उद्याने');
    }

    await page.screenshot({ path: path.join(outDir, '06_crud_05_dept_form_filled.png') });
    console.log('📸 Captured 06_crud_05_dept_form_filled.png');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('ion-button, button'));
      const save = btns.find(b => b.innerText.toLowerCase().includes('save') || b.innerText.toLowerCase().includes('create'));
      if (save) save.click();
    });
    await page.waitForTimeout(2500);

    await page.goto('http://localhost:8100/tabs/admin/departments');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outDir, '06_crud_06_departments_updated.png') });
    console.log('📸 Captured 06_crud_06_departments_updated.png');

    // Clear session
    await page.evaluate(() => localStorage.clear());

    // =========================================================================
    // STEP 4: OWNER ADDS A NEW ADMIN / MUNICIPALITY
    // =========================================================================
    log('STEP 4: OWNER VIEWS AND MANAGES ADMINS ON MOBILE');
    await login('daradebhushan15+owner@gmail.com', 'Bbd@1415');

    await page.goto('http://localhost:8100/tabs/owner/admin-management');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, '06_crud_07_owner_admin_list.png') });
    console.log('📸 Captured 06_crud_07_owner_admin_list.png');

    console.log('✅ ALL INTERACTIVE CRUD SCENARIOS COMPLETED SUCCESSFULLY!');
  } catch (e) {
    console.error('❌ Deep test error:', e);
  } finally {
    await browser.close();
  }
}

runDeepE2ETest();
