import React from "react";

function App() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      {/* Logo */}
      <img
        src="/logo.png"
        alt="Logo Disk Mensagem"
        style={{ width: "200px", marginBottom: "20px" }}
      />

      {/* Título */}
      <h1>Disk Mensagem</h1>
      <p>Bem-vindo ao seu aplicativo 🚀</p>

      {/* Botões */}
      <div style={{ marginTop: "30px" }}>
        <a
          href="/admin"
          style={{
            padding: "10px 20px",
            margin: "10px",
            background: "#007bff",
            color: "white",
            borderRadius: "5px",
            textDecoration: "none",
          }}
        >
          Painel Admin
        </a>

        <a
          href="/"
          style={{
            padding: "10px 20px",
            margin: "10px",
            background: "#28a745",
            color: "white",
            borderRadius: "5px",
            textDecoration: "none",
          }}
        >
          Página Inicial
        </a>
      </div>
    </div>
  );
}

export default App;
