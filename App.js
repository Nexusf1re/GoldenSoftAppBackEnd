const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Configurar a conexão com o banco de dados usando variáveis do .env
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.SSL_CA
  }
});

// Testar a conexão ao banco de dados
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados.');
});

// Rota para servir o index.html
app.get('/', (req, res) => {
  res.redirect('https://goldensoft-despesas.vercel.app/');
});


// Rota de cadastro de usuário
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Verifica se todos os campos foram preenchidos
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Por favor, preencha todos os campos." });
  }

  // Verifica se o email ou username já existem no DB
  const checkQuery = 'SELECT * FROM Usuarios WHERE email = ? OR username = ?';
  connection.query(checkQuery, [email, name], async (err, results) => {
    if (err) {
      console.error("Erro ao verificar email e username:", err);
      return res.status(500).json({ message: "Erro ao processar o cadastro." });
    }

    // Verifica se existe algum usuário com o email ou username fornecido
    const existingUser = results.find(user => user.email === email || user.username === name);
    if (existingUser) {
      const message = existingUser.email === email ? "Este email já está em uso." : "Este nome já está em uso.";
      return res.status(400).json({ message });
    }

    try {
      // Gera um hash para a password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insere o usuário no banco de dados
      const insertQuery = 'INSERT INTO Usuarios (username, email, password) VALUES (?, ?, ?)';
      connection.query(insertQuery, [name, email, hashedPassword], (err, result) => {
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
  const { username, password } = req.body; // Certifique-se de que 'username' e 'password' sejam os campos corretos enviados no frontend

  // Verifica se os campos foram preenchidos
  if (!username || !password) {
    return res.status(400).json({ message: "Por favor, preencha o nome de usuário e a senha." });
  }

  // Verifica se o usuário existe no banco de dados
  const userQuery = 'SELECT * FROM Usuarios WHERE nome = ?'; // Usando o nome de usuário
  connection.query(userQuery, [username], async (err, results) => {
    if (err) {
      console.error("Erro ao verificar usuário:", err);
      return res.status(500).json({ message: "Erro ao processar o login." });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Usuário não encontrado." });
    }

    const user = results[0];

    // Verifica se a senha está correta
    const passwordMatch = await bcrypt.compare(password, user.senha); // Verifica a senha hash
    if (!passwordMatch) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    // Aqui, você pode gerar o token JWT (se já instalou o JWT) ou iniciar a sessão do usuário
    res.status(200).json({ message: "Login bem-sucedido!" });
  });
});


// Rota para inserir dados
app.post("/inserir", (req, res) => {
  const { nome, valor, descricao, data } = req.body;
  const query = "INSERT INTO Despesas (nome, valor, descricao, data) VALUES (?, ?, ?, ?)";

  connection.query(query, [nome, valor, descricao, data], (err, results) => {
    if (err) {
      console.error("Error inserting data:", err);
      return res.status(500).send("Erro ao inserir os dados");
    }
    res.status(200).send("Dados inseridos com sucesso!");
  });
});


//Movimentacoes Db para o frontend
app.get('/movimentacoes', (req, res) => {
  const sql = 'SELECT categoria FROM Movimentacoes';
  
  connection.query(sql, (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(results);  // Retorna as movimentações em formato JSON
  });
});

//Vendedores Db para o frontend
app.get('/vendedores', (req, res) => {
  const sql = 'SELECT vendedor FROM Vendedores';
  
  connection.query(sql, (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(results);  // Retorna os vendedores em formato JSON
  });
});




// Rota de teste para verificar se o acesso ao banco está funcionando
app.get('/testar', (req, res) => {
  const query = 'SELECT * FROM Despesas AS resultado';

  connection.query(query, (err, results) => {
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

// Desconectar ao encerrar o servidor
process.on('SIGINT', () => {
  connection.end(err => {
    if (err) {
      console.error('Erro ao desconectar do banco de dados:', err);
    }
    console.log('Desconectado do banco de dados.');
    process.exit();
  });
});
