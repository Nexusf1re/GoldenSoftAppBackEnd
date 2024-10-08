const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Movimentacoes Db para o frontend
router.get('/movimentacoes', (req, res) => {
  const sql = 'SELECT categoria FROM Movimentacoes';

  pool.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Movimentacoes Db para o frontend
router.get('/movimentacoesGeral', (req, res) => {
  const sql = 'SELECT categoria FROM MovimentacoesGeral';

  pool.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

module.exports = router;
