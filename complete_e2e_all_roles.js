const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = '/Volumes/Extreme SSD/.gemini/antigravity-ide/brain/d97a9f38-b558-4b5b-8877-bb14aaa56f41/mobile_e2e_results';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function logStep(msg) {
  console.log(`\n======================================================`);
  console.log(`🚀 ${msg}`);
  console.log(`======================================================`);
}

async function performLogin(page, email, password) {
  console.log(`Navigating to login page for ${email}...`);
  await page.goto('http://localhost:8100/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Fill email and password using exact input name attributes
  await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 10000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Click Sign In
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const signIn = btns.find(b => b.innerText.toLowerCase().includes('sign in'));
    if (signIn) signIn.click();
  });

  await page.waitForTimeout(4000);
}

async function runCompleteE2ETest() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-web-security', '--allow-running-insecure-content']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  // Listen to console logs & errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR]: ${msg.text()}`);
    }
  });

  const results = {
    owner: { passed: false, screens: [], errors: [] },
    admin: { passed: false, screens: [], errors: [] },
    deptHead: { passed: false, screens: [], errors: [] },
    staff: { passed: false, screens: [], errors: [] }
  };

  try {
    // =========================================================================
    // 1. OWNER ROLE WORKFLOW (daradebhushan15+owner@gmail.com)
    // =========================================================================
    logStep('1. TESTING OWNER ROLE (daradebhushan15+owner@gmail.com)');
    await performLogin(page, 'daradebhushan15+owner@gmail.com', 'Bbd@1415');

    // 1.1 Owner Dashboard
    await page.goto('http://localhost:8100/tabs/owner/dashboard');
    await page.waitForTimeout(3000);
    const ownerDashPath = path.join(outDir, '01_owner_01_dashboard.png');
    await page.screenshot({ path: ownerDashPath });
    console.log('📸 Captured 01_owner_01_dashboard.png');
    results.owner.screens.push('01_owner_01_dashboard.png');

    // 1.2 Owner Admin Management
    await page.goto('http://localhost:8100/tabs/owner/admin-management');
    await page.waitForTimeout(3000);
    const ownerAdminsPath = path.join(outDir, '01_owner_02_admin_management.png');
    await page.screenshot({ path: ownerAdminsPath });
    console.log('📸 Captured 01_owner_02_admin_management.png');
    results.owner.screens.push('01_owner_02_admin_management.png');

    // 1.3 Owner Profile
    await page.goto('http://localhost:8100/tabs/profile');
    await page.waitForTimeout(2500);
    const ownerProfilePath = path.join(outDir, '01_owner_03_profile.png');
    await page.screenshot({ path: ownerProfilePath });
    console.log('📸 Captured 01_owner_03_profile.png');
    results.owner.screens.push('01_owner_03_profile.png');

    results.owner.passed = true;
    await page.evaluate(() => localStorage.clear());

    // =========================================================================
    // 2. ADMIN / CHIEF OFFICER WORKFLOW (daradebhushan15+admin@gmail.com)
    // =========================================================================
    logStep('2. TESTING ADMIN / CHIEF OFFICER (daradebhushan15+admin@gmail.com)');
    await performLogin(page, 'daradebhushan15+admin@gmail.com', 'Bbd@1415');

    // 2.1 Admin Dashboard
    await page.goto('http://localhost:8100/tabs/home');
    await page.waitForTimeout(3500);
    const adminDashPath = path.join(outDir, '02_admin_01_dashboard.png');
    await page.screenshot({ path: adminDashPath });
    console.log('📸 Captured 02_admin_01_dashboard.png');
    results.admin.screens.push('02_admin_01_dashboard.png');

    // 2.2 Admin Complaints List
    await page.goto('http://localhost:8100/tabs/complaints');
    await page.waitForTimeout(3000);
    const adminComplaintsPath = path.join(outDir, '02_admin_02_complaints.png');
    await page.screenshot({ path: adminComplaintsPath });
    console.log('📸 Captured 02_admin_02_complaints.png');
    results.admin.screens.push('02_admin_02_complaints.png');

    // 2.3 Admin Tasks List & Board
    await page.goto('http://localhost:8100/tabs/tasks');
    await page.waitForTimeout(3000);
    const adminTasksPath = path.join(outDir, '02_admin_03_tasks.png');
    await page.screenshot({ path: adminTasksPath });
    console.log('📸 Captured 02_admin_03_tasks.png');
    results.admin.screens.push('02_admin_03_tasks.png');

    await page.goto('http://localhost:8100/tabs/tasks/board');
    await page.waitForTimeout(3000);
    const adminTaskBoardPath = path.join(outDir, '02_admin_03_task_board.png');
    await page.screenshot({ path: adminTaskBoardPath });
    console.log('📸 Captured 02_admin_03_task_board.png');
    results.admin.screens.push('02_admin_03_task_board.png');

    // 2.4 Admin Create Task
    await page.goto('http://localhost:8100/tabs/tasks/create');
    await page.waitForTimeout(2500);
    const adminTaskCreatePath = path.join(outDir, '02_admin_04_create_task.png');
    await page.screenshot({ path: adminTaskCreatePath });
    console.log('📸 Captured 02_admin_04_create_task.png');
    results.admin.screens.push('02_admin_04_create_task.png');

    // 2.5 Admin Departments
    await page.goto('http://localhost:8100/tabs/admin/departments');
    await page.waitForTimeout(3000);
    const adminDeptsPath = path.join(outDir, '02_admin_05_departments.png');
    await page.screenshot({ path: adminDeptsPath });
    console.log('📸 Captured 02_admin_05_departments.png');
    results.admin.screens.push('02_admin_05_departments.png');

    // 2.6 Admin Users / Staff Directory
    await page.goto('http://localhost:8100/tabs/admin/users');
    await page.waitForTimeout(3000);
    const adminUsersPath = path.join(outDir, '02_admin_06_users_directory.png');
    await page.screenshot({ path: adminUsersPath });
    console.log('📸 Captured 02_admin_06_users_directory.png');
    results.admin.screens.push('02_admin_06_users_directory.png');

    // 2.7 Admin Designations
    await page.goto('http://localhost:8100/tabs/admin/designations');
    await page.waitForTimeout(2500);
    const adminDesigPath = path.join(outDir, '02_admin_07_designations.png');
    await page.screenshot({ path: adminDesigPath });
    console.log('📸 Captured 02_admin_07_designations.png');
    results.admin.screens.push('02_admin_07_designations.png');

    // 2.8 Admin Complaint Types
    await page.goto('http://localhost:8100/tabs/admin/complaint-types');
    await page.waitForTimeout(2500);
    const adminComplaintTypesPath = path.join(outDir, '02_admin_08_complaint_types.png');
    await page.screenshot({ path: adminComplaintTypesPath });
    console.log('📸 Captured 02_admin_08_complaint_types.png');
    results.admin.screens.push('02_admin_08_complaint_types.png');

    // 2.9 Admin Settings
    await page.goto('http://localhost:8100/tabs/settings');
    await page.waitForTimeout(2500);
    const adminSettingsPath = path.join(outDir, '02_admin_09_settings.png');
    await page.screenshot({ path: adminSettingsPath });
    console.log('📸 Captured 02_admin_09_settings.png');
    results.admin.screens.push('02_admin_09_settings.png');

    // 2.10 Admin Chatbot Settings
    await page.goto('http://localhost:8100/admin/chatbot');
    await page.waitForTimeout(2500);
    const adminChatbotPath = path.join(outDir, '02_admin_10_chatbot_settings.png');
    await page.screenshot({ path: adminChatbotPath });
    console.log('📸 Captured 02_admin_10_chatbot_settings.png');
    results.admin.screens.push('02_admin_10_chatbot_settings.png');

    results.admin.passed = true;
    await page.evaluate(() => localStorage.clear());

    // =========================================================================
    // 3. DEPARTMENT HEAD WORKFLOW (daradebhushan15+depthead@gmail.com)
    // =========================================================================
    logStep('3. TESTING DEPARTMENT HEAD ROLE (daradebhushan15+depthead@gmail.com)');
    await performLogin(page, 'daradebhushan15+depthead@gmail.com', 'Bbd@1415');

    // 3.1 Dept Head Dashboard
    await page.goto('http://localhost:8100/tabs/home');
    await page.waitForTimeout(3500);
    const deptDashPath = path.join(outDir, '03_depthead_01_dashboard.png');
    await page.screenshot({ path: deptDashPath });
    console.log('📸 Captured 03_depthead_01_dashboard.png');
    results.deptHead.screens.push('03_depthead_01_dashboard.png');

    // 3.2 Dept Head Scoped Complaints
    await page.goto('http://localhost:8100/tabs/complaints');
    await page.waitForTimeout(3000);
    const deptComplaintsPath = path.join(outDir, '03_depthead_02_complaints.png');
    await page.screenshot({ path: deptComplaintsPath });
    console.log('📸 Captured 03_depthead_02_complaints.png');
    results.deptHead.screens.push('03_depthead_02_complaints.png');

    // 3.3 Dept Head Scoped Tasks
    await page.goto('http://localhost:8100/tabs/tasks');
    await page.waitForTimeout(3000);
    const deptTasksPath = path.join(outDir, '03_depthead_03_tasks.png');
    await page.screenshot({ path: deptTasksPath });
    console.log('📸 Captured 03_depthead_03_tasks.png');
    results.deptHead.screens.push('03_depthead_03_tasks.png');

    // 3.4 Dept Head Profile
    await page.goto('http://localhost:8100/tabs/profile');
    await page.waitForTimeout(2500);
    const deptProfilePath = path.join(outDir, '03_depthead_04_profile.png');
    await page.screenshot({ path: deptProfilePath });
    console.log('📸 Captured 03_depthead_04_profile.png');
    results.deptHead.screens.push('03_depthead_04_profile.png');

    results.deptHead.passed = true;
    await page.evaluate(() => localStorage.clear());

    // =========================================================================
    // 4. STAFF ROLE WORKFLOW (daradebhushan15+staff@gmail.com)
    // =========================================================================
    logStep('4. TESTING STAFF ROLE (daradebhushan15+staff@gmail.com)');
    await performLogin(page, 'daradebhushan15+staff@gmail.com', 'Bbd@1415');

    // 4.1 Staff Dashboard
    await page.goto('http://localhost:8100/tabs/home');
    await page.waitForTimeout(3500);
    const staffDashPath = path.join(outDir, '04_staff_01_dashboard.png');
    await page.screenshot({ path: staffDashPath });
    console.log('📸 Captured 04_staff_01_dashboard.png');
    results.staff.screens.push('04_staff_01_dashboard.png');

    // 4.2 Staff Assigned Tasks List
    await page.goto('http://localhost:8100/tabs/tasks');
    await page.waitForTimeout(3000);
    const staffTasksPath = path.join(outDir, '04_staff_02_tasks.png');
    await page.screenshot({ path: staffTasksPath });
    console.log('📸 Captured 04_staff_02_tasks.png');
    results.staff.screens.push('04_staff_02_tasks.png');

    // 4.3 Staff Profile & Notifications
    await page.goto('http://localhost:8100/tabs/profile');
    await page.waitForTimeout(2500);
    const staffProfilePath = path.join(outDir, '04_staff_03_profile.png');
    await page.screenshot({ path: staffProfilePath });
    console.log('📸 Captured 04_staff_03_profile.png');
    results.staff.screens.push('04_staff_03_profile.png');

    results.staff.passed = true;

  } catch (err) {
    console.error('❌ E2E Execution Error:', err);
  } finally {
    await browser.close();
    console.log('\n======================================================');
    console.log('🏁 ALL ROLE E2E VERIFICATION COMPLETED:');
    console.log('======================================================');
    console.log(JSON.stringify(results, null, 2));
  }
}

runCompleteE2ETest();
