const apiUrl = 'https://townseva.in/api';

async function testCRUD() {
    console.log('--- STARTING EXHAUSTIVE CRUD API TEST ---');

    console.log('\n1. Authenticating as Bhagyashree...');
    const loginRes = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bhagyashreekale1508@gmail.com', password: 'Bbd@1415' })
    });
    const loginData = await loginRes.json();
    if (!loginData.data || !loginData.data.token) throw new Error('Login failed: ' + JSON.stringify(loginData));
    const token = loginData.data.token;
    console.log('✅ Token received');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    console.log('\n2. Testing Department CRUD...');
    const newDeptRes = await fetch(`${apiUrl}/admin/departments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Architecture Test', description: 'Testing the creation logic', nameMr: 'वास्तुशास्त्र' })
    });
    let dept = await newDeptRes.json();
    console.log('Create Dept response:', dept);
    if (!dept.success) console.error('Create Dept failed');

    console.log('\n3. Testing Task CRUD...');
    const newTaskRes = await fetch(`${apiUrl}/admin/tasks`, { // Check endpoints
        method: 'POST',
        headers,
        body: JSON.stringify({ 
            title: 'Test Task from Mobile Test', 
            description: 'Task description',
            status: 'PENDING',
            departmentId: 1
        })
    });
    let task = await newTaskRes.json();
    console.log('Create Task response:', task);

    console.log('\n--- API TEST COMPLETED ---');
}

testCRUD().catch(e => {
    console.error(e);
});
