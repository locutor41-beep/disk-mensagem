import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Admin from "./Admin.jsx";
import AdminMessages from "./AdminMessages.jsx";
import AdminOrders from "./AdminOrders.jsx";
import useAppConfig from "./useAppConfig.js";

function Home() {
  const cfg = useAppConfig();
  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      {/* logo */}
      <img
        src="https://raw.githubusercontent.com/locutor41-beep/disk-mensagem/main/frontend/public/logo.png"
        alt="Logo"
        width="140"
        height="140"
        style={{ borderRadius: 12, objectFit: "cover" }}
      />

      <h1 style={{ marginTop: 16 }}>Disk Mensagem</h1>
      <p>Bem-vindo ao seu aplicativo 🚀</p>

      {/* menu de navegação */}
      <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
        <Link to="/admin" className="btn">Painel</Link>
        <Link to="/admin/messages" className="btn">Mensagens</Link>
        <Link to="/admin/orders" className="btn">Pedidos</Link>
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

      {/* informações dinâmicas (opcional) */}
      <div style={{ marginTop: 28, color: "#444" }}>
        <div>WhatsApp (E.164): <b>{cfg.whats_e164}</b></div>
        <div>Telefone para exibição: <b>{cfg.phone_display}</b></div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* rotas do admin */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        {/* fallback: qualquer outra rota → Home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
