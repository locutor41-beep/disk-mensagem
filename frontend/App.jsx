import React, { useEffect, useState } from "react";
import Admin from "./Admin.jsx";
import AdminMessages from "./AdminMessages.jsx";
import AdminOrders from "./AdminOrders.jsx";

/** Home pública simples */
function Home() {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 20, textAlign: "center" }}>
      <img
        src="public/logo.png"
        alt="Logo"
        style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12 }}
      />
      <h1 style={{ marginTop: 16 }}>Disk Mensagem</h1>
      <p>Bem-vindo ao seu aplicativo 🎙️</p>

      <div style={{ marginTop: 24 }}>
        <a
          href="#/admin"
          style={{
            background: "#111827",
            color: "#fff",
            textDecoration: "none",
            padding: "10px 16px",
            borderRadius: 8,
          }}
        >
          Entrar no Painel Admin
        </a>
      </div>
    </div>
  );
}

/** Roteador com hash (#) para funcionar como site estático */
export default function App() {
  const [path, setPath] = useState(() => window.location.hash.replace(/^#/, "") || "/");

  useEffect(() => {
    const onHashChange = () => {
      setPath(window.location.hash.replace(/^#/, "") || "/");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Normaliza: sem nada = "/"
  const route = path || "/";

  // Rotas
  if (route.startsWith("/admin/messages")) return <AdminMessages />;
  if (route.startsWith("/admin/orders")) return <AdminOrders />;
  if (route.startsWith("/admin")) return <Admin />;

  // Padrão: Home
  return <Home />;
}
