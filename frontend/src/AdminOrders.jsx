import React, { useEffect, useMemo, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const getToken = () => localStorage.getItem("adm_token") || "";

// UI helpers (mesmos do outro)
const box = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 };
const row = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
  gap: 12,
  alignItems: "end",
  marginBottom: 12,
};
const input = { padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb" };
const table = { width: "100%", borderCollapse: "collapse" };
const thtd = { borderBottom: "1px solid #f1f5f9", padding: "10px 8px", textAlign: "left" };

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

export default function AdminOrders() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  // filtros
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState(""); // vazio = todos
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/admin/orders`, {
          headers: {
            "Accept": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
        });
        const data = await res.json();
        if (!alive) return;
        setOrders(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        console.error("Erro ao carregar pedidos:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    const fromMs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toMs = to ? new Date(to + "T23:59:59").getTime() : null;

    let items = [...orders];

    if (text) {
      items = items.filter(o => {
        const name = (o?.customer_name || o?.name || "").toLowerCase();
        const city = (o?.city || "").toLowerCase();
        const phone = (o?.phone || o?.whatsapp || "").toLowerCase();
        const title = (o?.title || "").toLowerCase();
        return (
          name.includes(text) ||
          city.includes(text) ||
          phone.includes(text) ||
          title.includes(text)
        );
      });
    }
    if (status) {
      items = items.filter(o => String(o?.status || "").toLowerCase() === status.toLowerCase());
    }
    if (fromMs || toMs) {
      items = items.filter(o => {
        const d = new Date(o?.created_at || o?.createdAt || o?.date || Date.now()).getTime();
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
  }, [orders, q, status, from, to]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, pageCount);
  const start = (pageSafe - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  useEffect(() => setPage(1), [q, status, from, to]);

  if (loading) return <p>Carregando pedidos…</p>;

  // gerador de CSV simples (export rápido)
  const exportCSV = () => {
    const heads = ["Data", "Cliente", "Telefone", "Cidade", "Status", "Título", "Total"];
    const lines = filtered.map(o => {
      const when = new Date(o?.created_at || o?.createdAt || o?.date || 0).toLocaleString();
      const tot = (o?.total ?? "").toString().replace(".", ",");
      return [
        `"${when}"`,
        `"${o?.customer_name || o?.name || ""}"`,
        `"${o?.phone || o?.whatsapp || ""}"`,
        `"${o?.city || ""}"`,
        `"${o?.status || ""}"`,
        `"${o?.title || ""}"`,
        `"${tot}"`,
      ].join(";");
    });
    const csv = [heads.join(";"), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pedidos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // status conhecidos (ajuste conforme o backend)
  const statusOptions = ["", "novo", "em_andamento", "concluido", "cancelado"];

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>📦 Pedidos</h2>

      <div style={{ ...box, marginBottom: 16 }}>
        <div style={row}>
          <div>
            <label>Busca</label>
            <input
              style={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="cliente, telefone, cidade, título…"
            />
          </div>
          <div>
            <label>Status</label>
            <select style={input} value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map(s => (
                <option key={s || "all"} value={s}>
                  {s ? s.replace(/_/g, " ") : "Todos"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>De</label>
            <input type="date" style={input} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label>Até</label>
            <input type="date" style={input} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={exportCSV} title="Exportar CSV">⬇ Exportar</button>
            <div style={{ marginLeft: "auto" }} />
          </div>
        </div>
      </div>

      <div style={box}>
        <table style={table}>
          <thead>
            <tr>
              <th style={thtd}>Data</th>
              <th style={thtd}>Cliente</th>
              <th style={thtd}>Telefone</th>
              <th style={thtd}>Cidade</th>
              <th style={thtd}>Status</th>
              <th style={thtd}>Título</th>
              <th style={thtd}>Total</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((o) => {
              const when = new Date(o?.created_at || o?.createdAt || o?.date || 0);
              const total = o?.total ?? "";
              return (
                <tr key={o?.id || o?._id || Math.random()}>
                  <td style={thtd}>{when.toLocaleString()}</td>
                  <td style={thtd}>{o?.customer_name || o?.name || "-"}</td>
                  <td style={thtd}>{o?.phone || o?.whatsapp || "-"}</td>
                  <td style={thtd}>{o?.city || "-"}</td>
                  <td style={thtd}>{o?.status || "-"}</td>
                  <td style={thtd}>{o?.title || "-"}</td>
                  <td style={thtd}>{typeof total === "number" ? total.toFixed(2) : total}</td>
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr>
                <td style={thtd} colSpan={7}>Nada encontrado com os filtros atuais.</td>
              </tr>
            )}
          </tbody>
        </table>

        <Pager page={pageSafe} pageCount={pageCount} onPage={setPage} />
      </div>
    </div>
  );
}
