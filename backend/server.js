// backend/server.js
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware padrão
app.use(cors());
app.use(express.json());

// Rota raiz — deve mostrar algo no navegador
app.get('/', (req, res) => {
  res.send('Servidor rodando 🚀');
});

// Rota de status simples
app.get('/status', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Rota GET de exemplo
app.get('/mensagem', (req, res) => {
  res.json({ mensagem: 'Rota GET /mensagem funcionando!' });
});

// Rota POST de exemplo (envie JSON no corpo)
app.post('/mensagem', (req, res) => {
  const { texto } = req.body || {};
  res.json({
    recebido: true,
    texto: texto || '(vazio)',
    hora: new Date().toISOString(),
  });
});

// 404 amigável para qualquer rota inexistente
app.use((req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    rota: req.originalUrl,
  });
});

// Importante: usar a porta do Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server ON na porta ${PORT}`);
});
