const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Vendedores Db para o frontend
router.get('/vendedores', (req, res) => {
  const sql = 'SELECT vendedor FROM Vendedores';

  pool.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

module.exports = router;
