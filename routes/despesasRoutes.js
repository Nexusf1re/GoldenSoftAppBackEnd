const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
const localTimestamp = require('../config/timestamp');

const router = express.Router();

// Rota para buscar os dados par o ENTRY
router.get("/entry", authenticateToken, (req, res) => {
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
router.post("/inserir", authenticateToken, (req, res) => {
  const { nome, valor, descricao, observacao, data } = req.body; 
  const username = req.user.username;

  const query = `INSERT INTO Despesas (nome, valor, descricao, observacao, data, user, dataLancamento) VALUES (?, ?, ?, ?, ?, ?, ${localTimestamp})`;

  pool.query(query, [nome, valor, descricao, observacao, data, username], (err, results) => {
    if (err) {
      console.error("Error inserting data:", err);
      return res.status(500).send("Erro ao inserir os dados");
    }
    res.status(200).send("Dados inseridos com sucesso!");
  });
});

module.exports = router;
