import React from "react";
import useAppConfig from "./useAppConfig.js";

export default function App() {
  const cfg = useAppConfig();

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <img
        src="https://raw.githubusercontent.com/locutor41-beep/disk-mensagem/main/frontend/public/logo.png"
        alt="Logo"
        width="140"
        height="140"
        style={{ borderRadius: 12, objectFit: "cover" }}
      />

      <h1 style={{ marginTop: 16 }}>Disk Mensagem</h1>
      <p>Bem-vindo ao seu aplicativo 🚀</p>

      <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
        <a href="/admin" className="btn">Painel</a>
        <a href="/admin/messages" className="btn">Mensagens</a>
        <a href="/admin/orders" className="btn">Pedidos</a>
      </div>

      <style>{`
        .btn {
          padding: 10px 16px;
          border-radius: 8px;
          background: #111827;
          color: #fff;
          text-decoration: none;
          font-weight: 600;
        }
        .btn:hover { background: #374151; }
      `}</style>

      <div style={{ marginTop: 28, color: "#444" }}>
        <div>WhatsApp (E.164): <b>{cfg.whats_e164}</b></div>
        <div>Telefone para exibição: <b>{cfg.phone_display}</b></div>
      </div>
    </div>
  );
}
