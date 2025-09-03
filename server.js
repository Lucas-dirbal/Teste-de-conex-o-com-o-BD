const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Configurar banco de dados
const db = new sqlite3.Database('./data.sqlite', (err) => {
  if (err) console.error(err.message);
  else console.log('Conectado ao banco SQLite.');
});

// Criar tabela users se não existir
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  cargo TEXT NOT NULL
)`);

// Inserir usuários de exemplo
const insertExamples = `INSERT OR IGNORE INTO users (nome, email, senha, cargo) VALUES
  ('Aluno Teste', 'aluno@teste.com', '123', 'estudante'),
  ('Admin Teste', 'admin@teste.com', '123', 'admin'),
  ('Pedagógico Teste', 'pedagogico@teste.com', '123', 'pedagogica');`;
db.run(insertExamples);

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'segredo',
  resave: false,
  saveUninitialized: true
}));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota de login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  db.get('SELECT * FROM users WHERE email = ? AND senha = ?', [email, senha], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Erro interno do servidor.');
    }
    if (!row) {
      return res.send('<h1>Login inválido</h1><a href="/index.html">Voltar</a>');
    }

    // Salva usuário na sessão
    req.session.user = row;

    // Redireciona conforme cargo
    if (row.cargo === 'estudante') {
      return res.redirect('/estudante.html');
    } else if (row.cargo === 'pedagogica') {
      return res.redirect('/pedagogica.html');
    } else if (row.cargo === 'admin') {
      return res.redirect('/administracao.html');
    } else {
      return res.send('Cargo desconhecido.');
    }
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