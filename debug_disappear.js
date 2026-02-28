const apiUrl = 'http://localhost:8080/api';

async function reproduceBug() {
    console.log('1. Authenticating as CO/Admin...');
    const loginRes = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'daradebhushan15+admin@gmail.com', password: 'Bbd@123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data ? loginData.data.token : loginData.token;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    console.log('2. Creating a test Department...');
    const newDeptRes = await fetch(`${apiUrl}/admin/departments`, {
        method: 'POST', headers,
        body: JSON.stringify({ name: 'Role Test Dept', description: 'Testing role bug', nameMr: 'रोल टेस्ट' })
    });
    let dept = await newDeptRes.json();
    if (dept.success) dept = dept.data;

    console.log('3. Creating a Department Head...');
    const newUserRes = await fetch(`${apiUrl}/admin/users`, {
        method: 'POST', headers,
        body: JSON.stringify({
            name: 'Role Test User', email: `roletest_${Date.now()}@test.com`, mobile: '5555555555',
            password: 'StrongPassword123!', role: 'DEPARTMENT_HEAD', designation: 'Head', departmentId: dept.id
        })
    });
    let user = await newUserRes.json();
    if (user.success) user = user.data;
    const userId = user.id;
    console.log(`- Created User ID: ${userId} as ${user.role}`);

    console.log('4. Fetching all users as Admin...');
    const allUsersRes1 = await fetch(`${apiUrl}/admin/users?size=100`, { headers });
    const allUsers1 = await allUsersRes1.json();
    const list1 = allUsers1.data ? allUsers1.data.content : allUsers1.content;
    const found1 = list1.find(u => u.id === userId);
    console.log(`- Is user in list? ${found1 ? 'YES' : 'NO'}`);

    console.log('5. Updating user role to STAFF...');
    await fetch(`${apiUrl}/admin/users/${userId}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ role: 'STAFF', designation: 'Staff', departmentId: dept.id })
    });

    console.log('6. Fetching all users as Admin again...');
    const allUsersRes2 = await fetch(`${apiUrl}/admin/users?size=100`, { headers });
    const allUsers2 = await allUsersRes2.json();
    const list2 = allUsers2.data ? allUsers2.data.content : allUsers2.content;
    const found2 = list2.find(u => u.id === userId);
    console.log(`- Is user in list after downgrade? ${found2 ? 'YES' : 'NO'}`);

    if (!found2) {
        console.log('BUG CONFIRMED: User disappeared!');

        // Check directly by ID to see what happened to their state
        const singleUserRes = await fetch(`${apiUrl}/admin/users/${userId}`, { headers });
        const singleUser = await singleUserRes.json();
        require('fs').writeFileSync('disappear_user.json', JSON.stringify(singleUser, null, 2));
        console.log('User state saved to disappear_user.json');
        console.log('User State:', JSON.stringify(singleUser, null, 2));
    }
}
reproduceBug().catch(console.error);
