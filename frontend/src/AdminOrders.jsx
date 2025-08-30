// frontend/src/AdminOrders.jsx
import React, { useEffect, useState } from "react";

export default function AdminOrders() {
  const API = import.meta.env.VITE_API_URL?.trim();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      setErr("");

      if (!API) {
        if (!cancel) {
          setOrders([]);
          setLoading(false);
          setErr(
            "VITE_API_URL não configurado. Crie .env com VITE_API_URL=https://sua-api"
          );
        }
        return;
      }

      try {
        const res = await fetch(`${API}/admin/orders`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!cancel) setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancel) setErr(`Falha ao carregar pedidos: ${e.message}`);
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, [API]);

  if (loading) return <div className="card">Carregando pedidos…</div>;

  return (
    <section className="card">
      <h2>Pedidos</h2>

      {err && <div className="alert">{err}</div>}

      {orders.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <ul className="list">
          {orders.map((o, i) => (
            <li key={o.id ?? i}>
              <div>
                <strong>Cliente:</strong> {o.customer ?? "—"}
              </div>
              <div className="muted">
                <strong>Valor:</strong> {formatMoney(o.amount)}
              </div>
              {o.status && (
                <div className="muted">
                  <strong>Status:</strong> {o.status}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return (n / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
