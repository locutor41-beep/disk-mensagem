import React from "react";
import cfg from "./siteConfig.js";     // <- agora importa o JS correto
import Admin from "./Admin.jsx";
import AdminMessages from "./AdminMessages.jsx";
import AdminOrders from "./AdminOrders.jsx";

export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <h1>{cfg.appName || "Disk Mensagem"}</h1>

      <p>
        Cidade: <b>{cfg.city_name}</b><br />
        Preço base: <b>R$ {(cfg.base_price_cents / 100).toFixed(2)}</b><br />
        WhatsApp (E.164): <b>{cfg.whats_e164}</b><br />
        Telefone p/ exibir: <b>{cfg.phone_display}</b>
      </p>

      <hr />

      <section>
        <h2>Painel do admin</h2>
        <Admin />
      </section>

      <section>
        <h2>Mensagens</h2>
        <AdminMessages />
      </section>

      <section>
        <h2>Pedidos</h2>
        <AdminOrders />
      </section>
    </div>
  );
}
