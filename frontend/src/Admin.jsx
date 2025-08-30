import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import AdminMessages from "./frontend/src/AdminMessages.jsx";
import AdminOrders from "./frontend/src/AdminOrders.jsx";

// Estilinho rápido pro menu (pode trocar por algo seu)
const navStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "16px",
  alignItems: "center",
  flexWrap: "wrap",
};
const linkStyle = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: "8px",
  textDecoration: "none",
  border: "1px solid #ddd",
  color: isActive ? "#fff" : "#333",
  background: isActive ? "#111827" : "#f4f4f5",
});

export default function Admin() {
  return (
    <div style={{ maxWidth: 920, margin: "24px auto", padding: "0 16px" }}>
      <h1>⚙️ Painel do Admin</h1>

      <nav style={navStyle}>
        <NavLink to="messages" style={linkStyle}>
          💬 Mensagens
        </NavLink>
        <NavLink to="orders" style={linkStyle}>
          📦 Pedidos
        </NavLink>
        <a
          href="/"
          style={{ marginLeft: "auto", color: "#2563eb", textDecoration: "none" }}
        >
          ← Voltar ao site
        </a>
      </nav>

      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <Routes>
          <Route path="/" element={<Navigate to="messages" replace />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="orders" element={<AdminOrders />} />
          {/* 404 dentro do admin */}
          <Route path="*" element={<Navigate to="messages" replace />} />
        </Routes>
      </div>
    </div>
  );
}
