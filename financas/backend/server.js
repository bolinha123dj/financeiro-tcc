require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

/* ── Middleware ─────────────────────────────────────────── */
app.use(cors({
  origin: [
    'http://localhost:5500', 
    'http://127.0.0.1:5500', 
    'http://localhost:3000', 
    'https://financeiro-tcc-gleison.vercel.app' // ADICIONADO: Permite que seu site na Vercel acesse a API
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Rotas ──────────────────────────────────────────────── */
app.use('/API/auth',         require('./routes/auth'));
app.use('/API/transactions', require('./routes/transactions'));
app.use('/API/goals',        require('./routes/goals'));

/* ── Health check (Importante para o Cron-job) ──────────── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/* ── 404 handler ────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ error: `Rota <LaTex>${req.method} $</LaTex>{req.path} não encontrada.` });
});

/* ── Error handler ──────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

/* ── Start ──────────────────────────────────────────────── */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando com sucesso!`);
});