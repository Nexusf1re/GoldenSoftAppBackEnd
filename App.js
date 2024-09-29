const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
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

// Rota de cadastro de usuário
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Verifica se todos os campos foram preenchidos
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Por favor, preencha todos os campos." });
  }

  // Verifica se o email ou nome já existem no DB
  const checkQuery = 'SELECT * FROM Usuarios WHERE email = ? OR nome = ?';
  connection.query(checkQuery, [email, name], async (err, results) => {
    if (err) {
      console.error("Erro ao verificar email e nome:", err);
      return res.status(500).json({ message: "Erro ao processar o cadastro." });
    }

    // Verifica se existe algum usuário com o email ou nome fornecido
    const existingUser = results.find(user => user.email === email || user.nome === name);
    if (existingUser) {
      const message = existingUser.email === email ? "Este email já está em uso." : "Este nome já está em uso.";
      return res.status(400).json({ message });
    }

    try {
      // Gera um hash para a senha
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insere o usuário no banco de dados
      const insertQuery = 'INSERT INTO Usuarios (nome, email, senha) VALUES (?, ?, ?)';
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
