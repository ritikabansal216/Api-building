const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 4000;
const JWT_SECRET = 'super-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// ─── In-Memory Store ──────────────────────────────────────────────────────────
const users = [];
const products = [
  { id: uuidv4(), name: 'Laptop Pro', price: 1299.99, stock: 50 },
  { id: uuidv4(), name: 'Wireless Mouse', price: 29.99, stock: 200 },
  { id: uuidv4(), name: 'USB-C Hub', price: 49.99, stock: 150 },
];

// Seed: one admin user
(async () => {
  users.push({
    id: uuidv4(),
    username: 'admin',
    email: 'admin@example.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
  });
  console.log('✅ Admin seeded: admin / admin123');
})();

// ─── Middleware ───────────────────────────────────────────────────────────────
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  };
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────
// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, role = 'user' } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'username, email, password are required' });
  if (users.find(u => u.email === email))
    return res.status(409).json({ error: 'Email already registered' });
  const safeRole = role === 'admin' ? 'user' : role; // prevent self-escalation
  const user = {
    id: uuidv4(),
    username,
    email,
    password: await bcrypt.hash(password, 10),
    role: safeRole,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  const { password: _, ...safe } = user;
  res.status(201).json({ message: 'User registered', user: safe });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ message: 'Login successful', token, role: user.role, username: user.username });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

// ─── User Routes (admin only) ─────────────────────────────────────────────────
// GET /api/users
app.get('/api/users', authenticate, requireRole('admin'), (req, res) => {
  res.json(users.map(({ password: _, ...u }) => u));
});

// DELETE /api/users/:id
app.delete('/api/users/:id', authenticate, requireRole('admin'), (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(idx, 1);
  res.json({ message: 'User deleted' });
});

// ─── Products Routes (public read, admin write) ───────────────────────────────
// GET /api/products
app.get('/api/products', authenticate, (req, res) => {
  res.json(products);
});

// POST /api/products
app.post('/api/products', authenticate, requireRole('admin'), (req, res) => {
  const { name, price, stock } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'name and price are required' });
  const product = { id: uuidv4(), name, price: Number(price), stock: Number(stock) || 0 };
  products.push(product);
  res.status(201).json(product);
});

// PUT /api/products/:id
app.put('/api/products/:id', authenticate, requireRole('admin'), (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  Object.assign(product, req.body);
  res.json(product);
});

// DELETE /api/products/:id
app.delete('/api/products/:id', authenticate, requireRole('admin'), (req, res) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(idx, 1);
  res.json({ message: 'Product deleted' });
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
