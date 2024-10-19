const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
const getLocalTimestamp = require('../config/timestamp'); // Importa a função de timestamp

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

  // Obtém o timestamp local usando a função
  const localTimestamp = getLocalTimestamp(); // Chama a função para obter o timestamp no formato correto

  const query = `INSERT INTO Despesas (nome, valor, descricao, observacao, data, user, dataLancamento) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  pool.query(query, [nome, valor, descricao, observacao, data, username, localTimestamp], (err, results) => {
    if (err) {
      console.error("Error inserting data:", err);
      return res.status(500).send("Erro ao inserir os dados");
    }
    res.status(200).send("Dados inseridos com sucesso!");
  });
});



// Rota para buscar os dados de uma despesa específica pelo ID
router.get("/entry/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const query = "SELECT id, nome, valor, descricao, observacao, data FROM Despesas WHERE id = ?";

  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar os dados:", err);
      return res.status(500).send("Erro ao buscar os dados");
    }
    
    if (results.length === 0) {
      return res.status(404).send("Despesa não encontrada");
    }
    
    res.status(200).json(results[0]); // Retorna apenas o primeiro resultado, pois o ID é único
  });
});



// Rota para atualizar uma despesas pelo ID
router.put("/entryUpdate/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const query = "UPDATE Despesas SET nome = ?, valor = ?, descricao = ?, observacao = ?, data = ? WHERE id = ?";

  pool.query(query, [req.body.nome, req.body.valor, req.body.descricao, req.body.observacao, req.body.data, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar os dados:", err);
      return res.status(500).send("Erro ao atualizar os dados");
    }
    res.status(200).send("Dados atualizados com sucesso!");
  });
});



//Rota para Deletar uma despesa pelo ID
router.delete("/entryDelete/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM Despesas WHERE id = ?";

  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar os dados:", err);
      return res.status(500).send("Erro ao deletar os dados");
    }
    res.status(200).send("Dados deletados com sucesso!");
  });
});



module.exports = router;
