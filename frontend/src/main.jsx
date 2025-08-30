import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Telas
import App from "./App.jsx";          // site público (clientes)
import Admin from "./Admin.jsx";      // painel admin principal
import AdminMessages from "./AdminMessages.jsx";  // listagem de mensagens
import AdminOrders from "./AdminOrders.jsx";      // listagem de pedidos

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Painel Admin */}
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/admin/orders" element={<AdminOrders />} />

        {/* Site público (clientes) */}
        <Route path="/*" element={<App />} />

        {/* Qualquer rota desconhecida → redireciona */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
