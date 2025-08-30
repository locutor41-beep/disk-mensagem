// frontend/src/AdminMessages.jsx
import React, { useEffect, useState } from "react";

export default function AdminMessages() {
  const API = import.meta.env.VITE_API_URL?.trim();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      setErr("");

      if (!API) {
        // Sem API configurada: mostra exemplo
        if (!cancel) {
          setMessages([]);
          setLoading(false);
          setErr(
            "VITE_API_URL não configurado. Crie .env com VITE_API_URL=https://sua-api"
          );
        }
        return;
      }

      try {
        const res = await fetch(`${API}/admin/messages`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!cancel) setMessages(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancel) setErr(`Falha ao carregar mensagens: ${e.message}`);
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, [API]);

  if (loading) return <div className="card">Carregando mensagens…</div>;

  return (
    <section className="card">
      <h2>Mensagens</h2>

      {err && <div className="alert">{err}</div>}

      {messages.length === 0 ? (
        <p>Nenhuma mensagem encontrada.</p>
      ) : (
        <ul className="list">
          {messages.map((m, i) => (
            <li key={m.id ?? i}>
              <strong>{m.title ?? "Sem título"}</strong>
              <div className="muted">{m.body ?? m.message ?? ""}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
