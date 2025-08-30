import React, { useEffect, useMemo, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const getToken = () => localStorage.getItem("adm_token") || "";

// UI helpers (visual simples)
const box = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 };
const row = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr",
  gap: 12,
  alignItems: "end",
  marginBottom: 12,
};
const input = { padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb" };
const table = { width: "100%", borderCollapse: "collapse" };
const thtd = { borderBottom: "1px solid #f1f5f9", padding: "10px 8px", textAlign: "left" };

// Component de paginação básico
function Pager({ page, pageCount, onPage }) {
  if (pageCount <= 1) return null;
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ◀
      </button>
      <span>
        Página {page} de {pageCount}
      </span>
      <button disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
        ▶
      </button>
    </div>
  );
}

export default function AdminMessages() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  // Filtros
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(""); // yyyy-mm-dd
  const [to, setTo] = useState("");     // yyyy-mm-dd
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // fetch
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/admin/messages`, {
          headers: {
            "Accept": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
        });
        const data = await res.json();
        if (!alive) return;
        setMessages(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // filtro + ordenação (mais recente primeiro)
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    const fromMs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toMs = to ? new Date(to + "T23:59:59").getTime() : null;

    let items = [...messages];

    if (text) {
      items = items.filter(m => {
        const title = (m?.title || "").toLowerCase();
        const body = (m?.body || "").toLowerCase();
        const cat = (m?.category?.name || m?.category || "").toLowerCase();
        const name = (m?.name || "").toLowerCase();
        return (
          title.includes(text) ||
          body.includes(text) ||
          cat.includes(text) ||
          name.includes(text)
        );
      });
    }
    if (fromMs || toMs) {
      items = items.filter(m => {
        const d = new Date(m?.created_at || m?.createdAt || m?.date || Date.now()).getTime();
        if (fromMs && d < fromMs) return false;
        if (toMs && d > toMs) return false;
        return true;
      });
    }

    items.sort((a, b) => {
      const da = new Date(a?.created_at || a?.createdAt || a?.date || 0).getTime();
      const db = new Date(b?.created_at || b?.createdAt || b?.date || 0).getTime();
      return db - da;
    });
    return items;
  }, [messages, q, from, to]);

  // paginação
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, pageCount);
  const start = (pageSafe - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  useEffect(() => setPage(1), [q, from, to]); // reset page ao trocar filtros

  if (loading) return <p>Carregando mensagens…</p>;

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>💬 Mensagens</h2>

      <div style={{ ...box, marginBottom: 16 }}>
        <div style={row}>
          <div>
            <label>Busca</label>
            <input
              style={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="cliente, título, texto, categoria…"
            />
          </div>
          <div>
            <label>De</label>
            <input type="date" style={input} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label>Até</label>
            <input type="date" style={input} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block" }}>Resultados</label>
            <strong>{filtered.length}</strong>
          </div>
        </div>
      </div>

      <div style={box}>
        <table style={table}>
          <thead>
            <tr>
              <th style={thtd}>Data</th>
              <th style={thtd}>Categoria</th>
              <th style={thtd}>Título</th>
              <th style={thtd}>Mensagem</th>
              <th style={thtd}>Cliente</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((m) => {
              const when = new Date(m?.created_at || m?.createdAt || m?.date || 0);
              return (
                <tr key={m?.id || m?._id || Math.random()}>
                  <td style={thtd}>{when.toLocaleString()}</td>
                  <td style={thtd}>{m?.category?.name || m?.category || "-"}</td>
                  <td style={thtd}>{m?.title || "-"}</td>
                  <td style={thtd}>{m?.body || "-"}</td>
                  <td style={thtd}>{m?.name || m?.customer_name || "-"}</td>
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr>
                <td style={thtd} colSpan={5}>Nada encontrado com os filtros atuais.</td>
              </tr>
            )}
          </tbody>
        </table>

        <Pager page={pageSafe} pageCount={pageCount} onPage={setPage} />
      </div>
    </div>
  );
}
