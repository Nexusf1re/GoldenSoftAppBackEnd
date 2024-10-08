const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();

// Middleware
app.use(cors({
  origin: 'https://goldensoft-despesas.vercel.app',
}));
app.use(express.json());

// Importar as rotas
const authRoutes = require('./routes/authRoutes');
const despesasRoutes = require('./routes/despesasRoutes');
const movimentacoesRoutes = require('./routes/movimentacoesRoutes');
const vendedoresRoutes = require('./routes/vendedoresRoutes');

// Usar as rotas
app.use('/auth', authRoutes);
app.use('/despesas', despesasRoutes);
app.use('/movimentacoes', movimentacoesRoutes);
app.use('/vendedores', vendedoresRoutes);

// Rota para servir o index.html
app.get('/', (req, res) => {
  res.redirect('https://goldensoft-despesas.vercel.app/');
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
