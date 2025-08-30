// frontend/src/App.jsx
import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Admin from "./Admin.jsx";
import AdminMessages from "./AdminMessages.jsx";
import AdminOrders from "./AdminOrders.jsx";

export default function App() {
  return (
    <div className="container">
      <header className="header">
        <img src="/logo.png" alt="Logo" className="logo" />
        <h1>Disk Mensagem</h1>
        <nav className="nav">
          <Link to="/">Início</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/admin/messages">Mensagens</Link>
          <Link to="/admin/orders">Pedidos</Link>
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          {/* qualquer rota desconhecida volta pra home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Home() {
  return (
    <section style={{ textAlign: "center", padding: "2rem" }}>
      <h2>Bem-vindo ao seu aplicativo 🚀</h2>
      <p>Use o menu para acessar o Painel Admin.</p>
    </section>
  );
}
