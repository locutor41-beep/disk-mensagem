// frontend/src/Admin.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Admin() {
  const api = import.meta.env.VITE_API_URL;

  return (
    <section className="card">
      <h2>Painel do Admin</h2>

      {!api ? (
        <div className="alert">
          <strong>Observação:</strong> a variável
          <code> VITE_API_URL </code>
          não está configurada. Você ainda consegue navegar, mas as listas vão
          aparecer vazias. Defina-a no arquivo <code>.env</code> (veja o passo
          “.env” no final).
        </div>
      ) : (
        <p>
          API configurada: <code>{api}</code>
        </p>
      )}

      <div className="grid">
        <Link className="btn" to="/admin/messages">
          📩 Ver Mensagens
        </Link>
        <Link className="btn" to="/admin/orders">
          🧾 Ver Pedidos
        </Link>
      </div>
    </section>
  );
}
