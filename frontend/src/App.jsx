import React, { useEffect, useState } from "react";
import fetchConfig from "./useAppConfig.js";
import Admin from "./Admin.jsx";
import siteCfg from "./siteConfig.json"; // arquivo que você pode editar os textos

function PriceNotice({ cfg }) {
  const price = (cfg.base_price_cents / 100).toFixed(2).replace(".", ",");
  const waMsg = encodeURIComponent(cfg.whatsapp_consulta_text || "Olá!");
  const whatsUrl = `https://wa.me/${cfg.whats_e164.replace("+", "")}?text=${waMsg}`;

  return (
    <div className="card">
      <div>
        <span className="badge">{cfg.price_badge_label || "Preço"}</span>
      </div>

      <h2>
        {(cfg.price_title_prefix || "Valor fixo: R$")} {price}
      </h2>

      <p>
        {(cfg.notice_line_1_prefix || "Válido para mensagens em")}{" "}
        <b>{cfg.city_name}</b>.
      </p>

      <p>{cfg.notice_line_2 || "Para outras localidades, consulte."}</p>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <a className="secondary button" href={whatsUrl} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <a className="secondary button" href={`tel:${cfg.whats_e164}`}>
          Ligar {cfg.phone_display}
        </a>
      </div>
    </div>
  );
}

function Messages({ categoryId, onPick }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      const url = new URL(import.meta.env.VITE_API_URL + "/public/messages");
      if (categoryId) url.searchParams.set("category_id", String(categoryId));
      if (q) url.searchParams.set("q", q);
      const res = await fetch(url);
      setItems(await res.json());
    };
    load();
  }, [categoryId, q]);

  return (
    <div>
      <input
        placeholder="Pesquisar mensagem"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="messages">
        {items.map((m) => (
          <div key={m.id} className="message" onClick={() => onPick(m)}>
            {m.title}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // tenta buscar config do backend
        const apiCfg = await fetchConfig();
        // mas sempre mistura com o JSON local (prioridade para JSON)
        setCfg({ ...apiCfg, ...siteCfg });
      } catch (e) {
        // se backend falhar, usa só o JSON
        setCfg({ ...siteCfg });
      }
    })();
  }, []);

  if (!cfg) return <p>Carregando...</p>;

  return (
    <div className="container">
      <h1>Disk Mensagem Stúdio Neil Marcos</h1>
      <PriceNotice cfg={cfg} />
      <Messages categoryId={null} onPick={(m) => console.log(m)} />
    </div>
  );
}

export default App;
