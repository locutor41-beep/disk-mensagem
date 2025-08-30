import React from "react";

export default function App() {
  return (
    <main style={{ maxWidth: 960, margin: "40px auto", textAlign: "center" }}>
      <img
        src="/logo.png"
        alt="Logo"
        style={{ width: 140, height: "auto", marginBottom: 16 }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <h1>Disk Mensagem</h1>
      <p>Bem-vindo ao seu aplicativo 🚀</p>

      {/* Remova os comentários abaixo quando quiser reativar as telas Admin */}
      {/* <Admin /> / <AdminMessages /> / <AdminOrders /> */}
    </main>
  );
}
