import React, { useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

// util p/ header de autorização
const authH = (token) => ({ Authorization: `Bearer ${token}` });

export default function AdminOrders({ token }) {
  const today = useMemo(() => {
    // data local (yyyy-mm-dd)
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const [date, setDate] = useState(today);
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState("");

  const downloadPDF = async () => {
    setMsg("");
    setDownloading(true);
    try {
      const url = `${API}/admin/agenda/pdf?date_str=${encodeURIComponent(date)}`;
      const res = await fetch(url, { headers: { ...authH(token) } });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Falha ao gerar PDF");
      }
      const blob = await res.blob();
      const fileName = `agenda-${date}.pdf`;

      // baixa arquivo
      const fileURL = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = fileURL;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(fileURL);

      setMsg("PDF gerado com sucesso.");
    } catch (e) {
      console.error(e);
      setMsg("Erro ao gerar PDF. Verifique CORS/token e tente novamente.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <h3>Pedidos do dia • Agenda em PDF</h3>

      <div className="grid" style={{ gap: 12 }}>
        <label>
          Data (YYYY-MM-DD)
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={downloadPDF} disabled={downloading}>
          {downloading ? "Gerando..." : "Baixar PDF da Agenda"}
        </button>
        <button
          className="secondary"
          onClick={() => setDate(today)}
          disabled={downloading}
        >
          Hoje
        </button>
      </div>

      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}

      <details style={{ marginTop: 12 }}>
        <summary>Ajuda</summary>
        <ul style={{ marginTop: 8 }}>
          <li>Se aparecer erro de CORS, no Render adicione o seu domínio da Vercel à variável <code>CORS_ORIGINS</code> e redeploy.</li>
          <li>O PDF lista todos os pedidos salvos para a data informada.</li>
        </ul>
      </details>
    </div>
  );
}
