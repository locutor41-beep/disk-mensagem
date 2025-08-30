import React, { useEffect, useState } from "react";
import siteCfg from "./siteConfig.json"; // textos/valores locais e fáceis de editar
import AdminMessages from "./AdminMessages.jsx"; // módulo de Categorias & Mensagens
import AdminOrders from "./AdminOrders.jsx";     // módulo de Pedidos/Agenda PDF

const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

// util: pegar/salvar token do admin
const getToken = () => localStorage.getItem("adm_token");
const setToken = (t) => localStorage.setItem("adm_token", t);
const clearToken = () => localStorage.removeItem("adm_token");

// ----------- Login -----------
function Login({ onOk }) {
  const [email, setEmail] = useState("admin@diskmensagem.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Falha no login");
      }
      const data = await res.json();
      setToken(data.access_token);
      onOk(data.access_token);
    } catch (err) {
      setError("Não foi possível entrar. Verifique usuário/senha.");
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: "40px auto" }}>
      <h2>Entrar (Admin)</h2>
      <form onSubmit={submit} className="card" style={{ padding: 16 }}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button type="submit">Entrar</button>
          <button type="button" className="secondary" onClick={() => { setEmail("admin@diskmensagem.local"); setPassword("admin123"); }}>
            Usar padrão
          </button>
        </div>
      </form>
      <p style={{ fontSize: 12, opacity: 0.8 }}>
        Dica: se aparecer erro de CORS, no Render troque <code>CORS_ORIGINS</code> para incluir
        <br />
        <code>{location.origin}</code> e redeploy.
      </p>
    </div>
  );
}

// ----------- Settings (configurações) -----------
function Settings({ token }) {
  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState(null);
  const [msg, setMsg] = useState("");

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${API}/admin/settings`, { headers: { ...authHeaders } });
      if (!res.ok) throw new Error(await res.text());
      const apiCfg = await res.json();
      // mescla com o JSON local — JSON tem prioridade onde existir
      const merged = { ...apiCfg, ...siteCfg };
      setCfg(merged);
    } catch (e) {
      // fallback: só JSON local
      setCfg({ ...siteCfg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    try {
      setMsg("Salvando...");
      const payload = {
        base_price_cents: Number(cfg.base_price_cents) || 0,
        city_name: String(cfg.city_name || ""),
        pix_key: String(cfg.pix_key || ""),
        whats_e164: String(cfg.whats_e164 || ""),
        phone_display: String(cfg.phone_display || "")
      };
      const res = await fetch(`${API}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      setMsg("Configurações salvas com sucesso!");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      console.error(err);
      setMsg("Erro ao salvar. Verifique CORS e token.");
    }
  };

  if (loading || !cfg) return <p style={{ padding: 16 }}>Carregando configurações…</p>;

  return (
    <div className="card" style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <h3>Configurações do App</h3>

      <div className="grid" style={{ gap: 12 }}>
        <label>
          Preço base (centavos)
          <input
            type="number"
            value={cfg.base_price_cents}
            onChange={(e) => setCfg({ ...cfg, base_price_cents: e.target.value })}
          />
        </label>

        <label>
          Cidade (exibição)
          <input
            value={cfg.city_name}
            onChange={(e) => setCfg({ ...cfg, city_name: e.target.value })}
          />
        </label>

        <label>
          Chave PIX
          <input
            value={cfg.pix_key || ""}
            onChange={(e) => setCfg({ ...cfg, pix_key: e.target.value })}
          />
        </label>

        <label>
          WhatsApp (E.164) — ex.: +5518999999999
          <input
            value={cfg.whats_e164}
            onChange={(e) => setCfg({ ...cfg, whats_e164: e.target.value })}
          />
        </label>

        <label>
          Telefone para exibir
          <input
            value={cfg.phone_display}
            onChange={(e) => setCfg({ ...cfg, phone_display: e.target.value })}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={save}>Salvar</button>
        <button className="secondary" onClick={load}>Recarregar</button>
        <button
          className="secondary"
          onClick={() => {
            // sobrescreve campos de contato com o JSON local
            setCfg({
              ...cfg,
              base_price_cents: siteCfg.base_price_cents ?? cfg.base_price_cents,
              city_name: siteCfg.city_name ?? cfg.city_name,
              phone_display: siteCfg.phone_display ?? cfg.phone_display,
              whats_e164: siteCfg.whats_e164 ?? cfg.whats_e164
            });
          }}
        >
          Usar textos do JSON
        </button>
      </div>

      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  );
}

// ----------- Layout do Admin -----------
export default function Admin() {
  const [token, setTok] = useState(getToken());

  useEffect(() => {
    // se não tiver API, avisa
    if (!API) {
      console.warn("VITE_API_URL não definido.");
    }
  }, []);

  if (!token) return <Login onOk={setTok} />;

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Admin • Disk Mensagem</h2>
        <span style={{ flex: 1 }} />
        <button
          className="secondary"
          onClick={() => {
            clearToken();
            location.reload();
          }}
        >
          Sair
        </button>
      </header>

      {/* Seções do admin */}
      <Settings token={token} />
      <AdminMessages token={token} />
      <AdminOrders token={token} />
    </div>
  );
}
