
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'path';
import morgan from 'morgan';
import helmet from 'helmet';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Setup ----
const app = express();
const db = new Database(path.join(__dirname, 'data.sqlite'));

// Middlewares
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 } // 4h
}));

app.use(express.static(path.join(__dirname, 'public')));

// ---- DB Init ----
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`);

// Create default admin if not exists
const adminEmail = 'admin@local';
const adminName = 'Administrador';
const adminPass = 'admin123'; // change after first login!

const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync(adminPass, 10);
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(adminName, adminEmail, hash, 'admin');
  console.log('> Usuário admin criado:', adminEmail, '(senha: admin123)');
}

// ---- Helpers ----
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
}

// ---- Auth Routes ----
app.post('/api/register', requireAuth, (req, res) => {
  // Only admin can create users
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Somente admin pode registrar usuários' });
  }
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, email, password' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name, email, hash, role || 'user');
    res.json({ id: info.lastInsertRowid, name, email, role: role || 'user' });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }
    console.error(e);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe email e senha' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

// ---- Items CRUD ----
app.get('/api/items', requireAuth, (req, res) => {
  const { q } = req.query;
  let rows;
  if (q) {
    const like = `%${q}%`;
    rows = db.prepare(`
      SELECT * FROM items
      WHERE name LIKE ? OR description LIKE ? OR sku LIKE ? OR location LIKE ?
      ORDER BY updated_at DESC
    `).all(like, like, like, like);
  } else {
    rows = db.prepare('SELECT * FROM items ORDER BY updated_at DESC').all();
  }
  res.json(rows);
});

app.post('/api/items', requireAuth, (req, res) => {
  const { name, description, sku, quantity, location } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  const qty = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
  try {
    const info = db.prepare(`
      INSERT INTO items (name, description, sku, quantity, location)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, description || null, sku || null, qty, location || null);
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(info.lastInsertRowid);
    res.json(item);
  } catch (e) {
    if (e.message.includes('UNIQUE') && sku) {
      return res.status(409).json({ error: 'SKU já cadastrado' });
    }
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar item' });
  }
});

app.put('/api/items/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const { name, description, sku, quantity, location } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  const qty = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
  try {
    db.prepare(`
      UPDATE items
      SET name = ?, description = ?, sku = ?, quantity = ?, location = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, description || null, sku || null, qty, location || null, id);
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json(item);
  } catch (e) {
    if (e.message.includes('UNIQUE') && sku) {
      return res.status(409).json({ error: 'SKU já cadastrado' });
    }
    console.error(e);
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

app.delete('/api/items/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM items WHERE id = ?').run(id);
  res.json({ ok: true });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`> Servidor rodando em http://localhost:${PORT}`);
});
