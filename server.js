const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Configura banco
const db = new sqlite3.Database('./data.sqlite', (err) => {
  if (err) console.error(err.message);
  else console.log('Conectado ao banco SQLite.');
});

// Cria tabela se não existir
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    cargo TEXT NOT NULL
  )`);
});

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'segredo',
  resave: false,
  saveUninitialized: true
}));

// Servir arquivos estáticos (HTML)
app.use(express.static(path.join(__dirname, 'public')));

// ------------------ ROTAS DA API ------------------

// Registro de novo usuário
app.post('/register', (req, res) => {
  const { nome, email, senha, cargo } = req.body;
  if (!nome || !email || !senha || !cargo) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  const sql = `INSERT INTO users (nome, email, senha, cargo) VALUES (?, ?, ?, ?)`;
  db.run(sql, [nome, email, senha, cargo], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', id: this.lastID });
  });
});

// Login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  db.get('SELECT * FROM users WHERE email = ? AND senha = ?', [email, senha], (err, row) => {
    if (err) return res.status(500).send('Erro interno.');
    if (!row) return res.status(401).send('Credenciais inválidas.');

    req.session.user = row;

    if (row.cargo === 'estudante') return res.redirect('/estudante.html');
    if (row.cargo === 'pedagogica') return res.redirect('/pedagogica.html');
    if (row.cargo === 'admin') return res.redirect('/administracao.html');
    return res.send('Cargo desconhecido.');
  });
});

// Listar usuários (apenas admin logado)
app.get('/users', (req, res) => {
  if (!req.session.user || req.session.user.cargo !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  db.all('SELECT id, nome, email, cargo FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar usuários' });
    res.json(rows);
  });
});

// Deletar usuário (apenas admin)
app.delete('/users/:id', (req, res) => {
  if (!req.session.user || req.session.user.cargo !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const sql = `DELETE FROM users WHERE id = ?`;
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Erro ao excluir usuário' });
    res.json({ message: 'Usuário excluído', changes: this.changes });
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/index.html');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});