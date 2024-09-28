const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

const app = express();

app.use(cors());
app.use(express.json());

// Configurar a conexão com o banco de dados usando variáveis do .env
const connection = mysql.createConnection({
  host: process.env.DB_HOST,         // Carrega do .env
  user: process.env.DB_USER,         // Carrega do .env
  password: process.env.DB_PASSWORD, // Carrega do .env
  database: process.env.DB_DATABASE, // Carrega do .env
  port: process.env.DB_PORT,         // Carrega do .env
  ssl: {
    ca: fs.readFileSync(__dirname + '/ssl/ca.pem') // Caminho correto para o certificado SSL
  }
});

// Testar a conexão ao banco de dados
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err); // Log detalhado do erro
    return;
  }
  console.log('Conectado ao banco de dados.');
});

// Rota de teste para verificar se o acesso ao banco está funcionando
app.get('/testar-conexao', (req, res) => {
  const query = 'SELECT 1 + 1 AS resultado'; // Consulta simples de teste
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao executar a query:', err); // Log detalhado do erro
      return res.status(500).json({ error: 'Erro ao acessar o banco de dados', details: err.message });
    }
    res.status(200).json(results); // Retorna o resultado da query
  });
});


app.post("/inserir", (req, res) => {
  const {nome, valor, descricao, data } = req.body;

  const query =
    "INSERT INTO Despesas (nome, valor, descricao, data) VALUES (?, ?, ?, ?)";

  connection.query(query, [nome, valor, descricao, data], (err, results) => {
    if (err) {
      console.error("Error inserting data:", err);
      return res.status(500).send("Erro ao inserir os dados");
    }
    res.status(200).send("Dados inseridos com sucesso!");
  });
});

// Iniciar o servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

// Exportar a aplicação para o Vercel
module.exports = app;