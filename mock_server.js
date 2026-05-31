const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // Accept test credentials
  if ((email === 'admin@nagarparishad.in' || email === 'owner@govt.in') && password === 'password') {
    const user = {
      id: email === 'admin@nagarparishad.in' ? 2 : 1,
      username: email.split('@')[0],
      email,
      roles: [email.startsWith('admin') ? 'ADMIN' : 'OWNER'],
      name: email.startsWith('admin') ? 'Admin' : 'Owner'
    };
    return res.json({ success: true, data: { token: 'fake-jwt-token', id: user.id, username: user.username, email: user.email, roles: user.roles, name: user.name } });
  }
  return res.status(401).json({ success: false, message: 'Wrong credentials' });
});

const complaint = {
  id: 1,
  complaintNo: 'C-001',
  citizenName: 'Test User',
  citizenMobile: '9999999999',
  description: 'Test complaint',
  photoUrl: `http://localhost:${PORT}/attachments/photo1.jpg`,
  status: 'PENDING',
  createdAt: new Date().toISOString(),
  attachments: [
    { id: 101, fileName: 'photo1.jpg', filePath: `/attachments/photo1.jpg`, fileType: 'image/jpeg', uploadedBy: 'citizen' },
    { id: 102, fileName: 'doc1.pdf', filePath: `/attachments/doc1.pdf`, fileType: 'application/pdf', uploadedBy: 'citizen' }
  ]
};

// Admin endpoints
app.get('/api/admin/complaints', (req, res) => {
  console.log('Mock: returning complaints list as array length=1 (admin)');
  res.json([complaint]);
});

app.get('/api/admin/complaints/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id === 1) {
    console.log('Mock: returning complaint detail id=1 (admin)');
    return res.json(complaint);
  }
  res.status(404).json({ success:false, message:'Not found' });
});

// Owner / public endpoints (mirror admin)
app.get('/api/complaints', (req, res) => {
  console.log('Mock: returning complaints list as array length=1 (public)');
  res.json([complaint]);
});
app.get('/api/complaints/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id === 1) {
    console.log('Mock: returning complaint detail id=1 (public)');
    return res.json(complaint);
  }
  res.status(404).json({ success:false, message:'Not found' });
});

app.get('/api/owner/complaints', (req, res) => {
  console.log('Mock: returning complaints list as array length=1 (owner)');
  res.json([complaint]);
});
app.get('/api/owner/complaints/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id === 1) {
    console.log('Mock: returning complaint detail id=1 (owner)');
    return res.json(complaint);
  }
  res.status(404).json({ success:false, message:'Not found' });
});

app.get('/attachments/photo1.jpg', (req, res) => {
  const img = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABGElEQVRYR+2WQQ7AIAxFf0XzXq3egm9hQb1C1poH0gkLw7J3s1u6QhJk7p+gGxBLYbH0g6M3k6qfA7gA8k3rX2xg0QGkqQ3wM4Yqj9mV1cGgXgM4Yp6H7D1rT5lB7A5rKpl5gI8gq0u3P2Q4g0hQYFqy4j8pJ2qM0Yk7yD8qwx3G4m6kq6G6nq1mWZrj1gI+gC6S7vS2fVxC4Bj1qgq0o4yI6gM3oGkqQ3yM8g6w7r1bqZp0mGZ1qg1gGQ3wG4gq2u1H6gG0g8gq0u3P2Q4g0hQYFqy4j8pJ2qM0Yk7yD8qwx3G4m6kq6G6nq1mWZrj1gI+gC6S7vS2fVxC4Bj1qgq0o4yI6gM3oGkqQ3yM8g6w7r1bqZp0mGZ1qg1gGQ3wG4gq2u1H6gG0g8gq0u3P2Q4g0hQYFq6v7/AJLJv3u8uX4QAAAAASUVORK5CYII=',
    'base64'
  );
  res.setHeader('Content-Type', 'image/png');
  res.send(img);
});

app.get('/api/admin/complaints/attachments/:id/download', (req, res) => {
  const id = parseInt(req.params.id);
  if (id === 101) {
    res.setHeader('Content-Type', 'image/jpeg');
    return res.send(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAr8B9lN6kQAAAABJRU5ErkJggg==','base64'));
  }
  res.status(404).send('Not found');
});

app.listen(PORT, () => console.log(`Mock server listening on http://localhost:${PORT}`));
