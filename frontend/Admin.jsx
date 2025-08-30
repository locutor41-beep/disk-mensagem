import React from "react";

function Admin() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Painel Administrativo</h1>
      <p>Gerencie seu aplicativo aqui 📊</p>

      <div style={{ marginTop: "30px" }}>
        <a
          href="/admin/messages"
          style={{
            padding: "10px 20px",
            margin: "10px",
            background: "#007bff",
            color: "white",
            borderRadius: "5px",
            textDecoration: "none",
          }}
        >
          Mensagens
        </a>

        <a
          href="/admin/orders"
          style={{
            padding: "10px 20px",
            margin: "10px",
            background: "#28a745",
            color: "white",
            borderRadius: "5px",
            textDecoration: "none",
          }}
        >
          Pedidos
        </a>

        <a
          href="/"
          style={{
            padding: "10px 20px",
            margin: "10px",
            background: "#6c757d",
            color: "white",
            borderRadius: "5px",
            textDecoration: "none",
          }}
        >
          Voltar ao Início
        </a>
      </div>
    </div>
  );
}

export default Admin;
