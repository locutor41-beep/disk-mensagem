import React from "react";
import cfg from "./siteConfig.js"; // Importa a configuração correta
import Admin from "./Admin.jsx";
import AdminMessages from "./AdminMessages.jsx";
import AdminOrders from "./AdminOrders.jsx";

export default function App() {
  return (
    <div>
      <h1>{cfg.appName || "Disk Mensagem"}</h1>

      {/* Seção de administração */}
      <section>
        <h2>Administração</h2>
        <Admin />
      </section>

      {/* Seção de mensagens */}
      <section>
        <h2>Mensagens</h2>
        <AdminMessages />
      </section>

      {/* Seção de pedidos */}
      <section>
        <h2>Pedidos</h2>
        <AdminOrders />
      </section>
    </div>
  );
}
