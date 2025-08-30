// backend/server.js
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("API Disk Mensagem ok ✅");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
