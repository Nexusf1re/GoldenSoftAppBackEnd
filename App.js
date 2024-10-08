const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/authMiddleware');
require('dotenv').config(); 
const app = express();

app.use(cors({
  origin: 'https://goldensoft-despesas.vercel.app',
}));
app.use(express.json());
app.use(express.static(__dirname));

// Constante para obter o timestamp local
const timestamp = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
}).format(new Date());

const realTimestamp = timestamp.replace(/\//g, '-').replace(',', '');

// Criar o pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.SSL_CA
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Testar a conexão ao banco de dados
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados.');

  // Libere a conexão após o teste
  connection.release();
});

// Rota para servir o index.html
app.get('/', (req, res) => {
  res.redirect('https://goldensoft-despesas.vercel.app/');
});

// Rota de cadastro de usuário
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Por favor, preencha todos os campos." });
  }

  const checkQuery = 'SELECT * FROM Usuarios WHERE email = ? OR username = ?';
  pool.query(checkQuery, [email, name], async (err, results) => {
    if (err) {
      console.error("Erro ao verificar email e username:", err);
      return res.status(500).json({ message: "Erro ao processar o cadastro." });
    }

    const existingUser = results.find(user => user.email === email || user.username === name);
    if (existingUser) {
      const message = existingUser.email === email ? "Este email já está em uso." : "Este nome já está em uso.";
      return res.status(400).json({ message });
    }

    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const insertQuery = `INSERT INTO Usuarios (username, email, password, dataCadastro) VALUES (?, ?, ?, '${realTimestamp}')`;
      pool.query(insertQuery, [name, email, hashedPassword], (err, result) => {
        if (err) {
          console.error("Erro ao inserir usuário:", err);
          return res.status(500).json({ message: "Erro ao cadastrar o usuário." });
        }
        res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
      });
    } catch (error) {
      console.error("Erro ao gerar o hash da senha:", error);
      res.status(500).json({ message: "Erro interno no servidor." });
    }
  });
});

// Rota de login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Por favor, preencha o nome de usuário e a senha." });
  }

  const userQuery = 'SELECT * FROM Usuarios WHERE username = ?';
  pool.query(userQuery, [username], async (err, results) => {
    if (err) {
      console.error("Erro ao verificar usuário:", err);
      return res.status(500).json({ message: "Erro ao processar o login." });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Usuário não encontrado." });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: "Login bem-sucedido!",
      token
    });
  });
});


app.get('/form', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Token válido' }); // Retorna status 200 se o token for válido
});


// Rota para buscar os dados par o ENTRY
app.get("/entry", authenticateToken, (req, res) => {
  const query = "SELECT id, nome, valor, descricao, observacao, data FROM Despesas";

  pool.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar os dados:", err);
      return res.status(500).send("Erro ao buscar os dados");
    }
    res.status(200).json(results);
  });
});



// Rota para inserir dados
app.post("/inserir", authenticateToken, (req, res) => {
  const { nome, valor, descricao,observacao, data } = req.body; 
  const username = req.user.username; // Supondo que o nome do usuário esteja em req.user após a autenticação

  const query = `INSERT INTO Despesas (nome, valor, descricao,observacao, data, user, dataLancamento) VALUES (?, ?, ? ,?, ?, ?, '${realTimestamp}')`;

  pool.query(query, [nome, valor, descricao, observacao, data, username], (err, results) => {
    if (err) {
      console.error("Error inserting data:", err);
      return res.status(500).send("Erro ao inserir os dados");
    }
    res.status(200).send("Dados inseridos com sucesso!");
  });
});



// Movimentacoes Db para o frontend
app.get('/movimentacoes', (req, res) => {
  const sql = 'SELECT categoria FROM Movimentacoes';
  
  pool.query(sql, (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(results);  // Retorna as movimentações em formato JSON
  });
});

// Movimentacoes Db para o frontend
app.get('/movimentacoesGeral', (req, res) => {
  const sql = 'SELECT categoria FROM MovimentacoesGeral';
  
  pool.query(sql, (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(results);  // Retorna as movimentações em formato JSON
  });
});

// Vendedores Db para o frontend
app.get('/vendedores', (req, res) => {
  const sql = 'SELECT vendedor FROM Vendedores';
  
  pool.query(sql, (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(results);  // Retorna os vendedores em formato JSON
  });
});

// Rota de teste para verificar se o acesso ao banco está funcionando
app.get('/testar', (req, res) => {
  const query = 'SELECT * FROM Despesas AS resultado';

  pool.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao executar a query:', err);
      return res.status(500).json({ error: 'Erro ao acessar o banco de dados', details: err.message });
    }
    res.status(200).json(results);
  });
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000; // Permite configuração via variável de ambiente
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`http://localhost:${PORT}/testar`);
});
