import React, { useEffect, useState } from "react";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/messages`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  if (loading) return <p>⏳ Carregando mensagens...</p>;

  if (!messages.length) return <p>Nenhuma mensagem encontrada.</p>;

  return (
    <div>
      <h2>📩 Mensagens recebidas</h2>
      <ul>
        {messages.map((msg, idx) => (
          <li key={idx}>
            <strong>{msg.nome}</strong> - {msg.texto} <br />
            <small>{msg.data}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
