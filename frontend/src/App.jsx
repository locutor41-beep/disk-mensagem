// frontend/src/App.jsx
import React from "react";

export default function App() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", textAlign: "center", padding: "20px" }}>
      {/* Logo */}
      <header>
        <img
          src="/logo.png"   // arquivo dentro da pasta public
          alt="Logo do Projeto"
          width="120"
          style={{ marginBottom: "20px" }}
        />
      </header>

      {/* Conteúdo principal */}
      <main>
        <h1>Disk Mensagem</h1>
        <p>Bem-vindo ao seu aplicativo 🚀</p>
      </main>
    </div>
  );
}
