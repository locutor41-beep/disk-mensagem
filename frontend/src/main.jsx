import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// estes arquivos existem na sua pasta src (vi no seu print)
import App from "./App.jsx";      // site do cliente
import Admin from "./Admin.jsx";  // painel de administração

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Painel do admin */}
        <Route path="/admin/*" element={<Admin />} />

        {/* Site público (clientes) */}
        <Route path="/*" element={<App />} />

        {/* Qualquer rota desconhecida volta pra home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
