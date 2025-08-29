import React, { useEffect, useState } from "react";
import { fetchConfig } from "./useAppConfig.js";
import Admin from "./Admin.jsx";

function PriceNotice({ cfg }) {
  const price = (cfg.base_price_cents / 100).toFixed(2).replace(".", ",");
  const waMsg = encodeURIComponent("Olá! Quero consultar mensagem para outra cidade.");
  const whatsUrl = `https://wa.me/${cfg.whats_e164.replace("+", "")}?text=${waMsg}`;

  return (
    <div className="card">
      <div>
        <span className="badge">Preço</span>
      </div>
      <h2>Valor fixo: R$ {price}</h2>
      <p>Válido para mensagens em <b>{cfg.city_name}</b>.</p>
      <p>Para chácaras, sítios e outras cidades, consulte via WhatsApp ou ligação.</p>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <a
          className="secondary button"
          href={whatsUrl}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>
        <a
          className="secondary button"
          href={`tel:${cfg.whats_e164}`}
        >
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
    const url = new URL(import.meta.env.VITE_API_URL + "/public/messages");
    if (categoryId) url.searchParams.set("category_id", String(categoryId));
    if (q) url.searchParams.set("q", q);

    fetch(url)
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, [categoryId, q]);

  return (
    <div className="messages">
      <input
        type="text"
        placeholder="Pesquisar mensagem"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul>
        {items.map((msg) => (
          <li key={msg.id} onClick={() => onPick(msg)}>
            {msg.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const [cfg, setCfg] = useState(null);
  const [pickedMsg, setPickedMsg] = useState(null);

  useEffect(() => {
    fetchConfig().then(setCfg);
  }, []);

  if (!cfg) return <p>Carregando...</p>;

  return (
    <div className="container">
      <h1>Disk Mensagem Stúdio Neil Marcos</h1>
      <PriceNotice cfg={cfg} />
      <Messages categoryId={null} onPick={setPickedMsg} />
      {pickedMsg && (
        <div className="picked">
          <h3>Mensagem selecionada</h3>
          <p>{pickedMsg.text}</p>
        </div>
      )}
    </div>
  );
}

export default App;
