import React from "react";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import AdminMessages from "./AdminMessages.jsx";
import AdminOrders from "./AdminOrders.jsx";

export default function Admin() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>Painel Administrativo</h1>

      {/* Menu de navegação */}
      <nav style={{ marginBottom: "20px" }}>
        <Link
          to="messages"
          style={{
            marginRight: "15px",
            textDecoration: "none",
            padding: "8px 12px",
            background: "#007bff",
            color: "white",
            borderRadius: "5px"
          }}
        >
          📩 Mensagens
        </Link>
        <Link
          to="orders"
          style={{
            textDecoration: "none",
            padding: "8px 12px",
            background: "#28a745",
            color: "white",
            borderRadius: "5px"
          }}
        >
          📋 Pedidos
        </Link>
      </nav>

      {/* Rotas internas do painel admin */}
      <Routes>
        <Route path="messages" element={<AdminMessages />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="*" element={<Navigate to="messages" replace />} />
      </Routes>
    </div>
  );
}
