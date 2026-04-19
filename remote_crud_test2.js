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
    const token = loginData.data.token;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    console.log('\n3. Testing Task CRUD correctly via /tasks/create ...');
    const newTaskRes = await fetch(`${apiUrl}/tasks/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
            title: 'Test Create Task from Node', 
            description: 'Task description',
            status: 'PENDING',
            departmentId: 1
        })
    });
    let task = await newTaskRes.json();
    console.log('Create Task response:', task);

    console.log('\n4. Testing Upload Attachment API to see if it causes issues...');
    
    // Check Tasks List
    const tasksRes = await fetch(`${apiUrl}/tasks`, { headers });
    let tasksData = await tasksRes.json();
    console.log('GET Tasks:', tasksData);
}

testCRUD().catch(e => console.error(e));
