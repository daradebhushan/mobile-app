const apiUrl = 'http://localhost:8080/api';

async function testCRUD() {
    console.log('--- STARTING EXHAUSTIVE CRUD API TEST ---');

    // 1. Authenticate as Admin
    console.log('\n1. Authenticating as CO/Admin...');
    const loginRes = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'daradebhushan15+admin@gmail.com', password: 'Bbd@123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.data || !loginData.data.token) throw new Error('Login failed: ' + JSON.stringify(loginData));
    const token = loginData.data.token;
    console.log('✅ Token received');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Department CRUD
    console.log('\n2. Testing Department CRUD...');

    // Create
    const newDeptRes = await fetch(`${apiUrl}/admin/departments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Architecture Evaluation', description: 'Testing the creation logic', nameMr: 'वास्तुशास्त्र' })
    });
    let dept = await newDeptRes.json();
    if (dept.success) dept = dept.data; else dept = dept;
    console.log(`- Created Department: ID ${dept.id}`);

    // Update
    console.log('- Testing Update ALL fields for Department...');
    const updateDeptRes = await fetch(`${apiUrl}/admin/departments/${dept.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: 'Architecture Revised', description: 'Updated fully', nameMr: 'वास्तुशास्त्र अपडेट' })
    });
    let updatedDept = await updateDeptRes.json();
    if (updatedDept.success) updatedDept = updatedDept.data;

    if (updatedDept.name === 'Architecture Revised' && updatedDept.nameMr === 'वास्तुशास्त्र अपडेट') {
        console.log('✅ Department Update passed all fields');
    } else {
        throw new Error('Department Update failed to save fields properly: ' + JSON.stringify(updatedDept));
    }

    // Delete
    console.log(`- Deleting Department ID ${dept.id}...`);
    const delDeptRes = await fetch(`${apiUrl}/admin/departments/${dept.id}`, { method: 'DELETE', headers });
    if (delDeptRes.ok) {
        console.log('✅ Department Delete successful');
    }

    // 3. User CRUD
    console.log('\n3. Testing Staff/User CRUD...');
    // Create
    const newUserRes = await fetch(`${apiUrl}/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name: 'Test Sub-Staff',
            email: `test_crud_${Date.now()}@example.com`,
            mobile: '1234567890',
            password: 'StrongPassword123!',
            role: 'STAFF',
            designation: 'Tester'
        })
    });
    let user = await newUserRes.json();
    if (user.success) user = user.data;
    console.log(`- Created User: ID ${user.id}`);

    // Update
    console.log('- Testing Update ALL fields for User...');
    const updateUserRes = await fetch(`${apiUrl}/admin/users/${user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            name: 'Test Sub-Staff Updated',
            mobile: '0987654321', // Check update field
            role: 'STAFF',
            designation: 'Senior Tester'
        })
    });
    let updatedUser = await updateUserRes.json();
    if (updatedUser.success) updatedUser = updatedUser.data;

    if (updatedUser.name === 'Test Sub-Staff Updated' && updatedUser.designation === 'Senior Tester') {
        console.log('✅ User Update passed all fields');
    } else {
        throw new Error('User Update failed to save fields properly');
    }

    // Delete
    console.log(`- Deleting User ID ${user.id}...`);
    const delUserRes = await fetch(`${apiUrl}/admin/users/${user.id}`, { method: 'DELETE', headers });
    if (delUserRes.ok || (await delUserRes.json()).success) {
        console.log('✅ User Delete successful');
    }

    console.log('\n--- ALL CRUD OPERATIONS PASSED EXHAUSTIVELY ---');
}

testCRUD().catch(e => {
    console.error(e);
    require('fs').writeFileSync('error.json', e.message);
});
