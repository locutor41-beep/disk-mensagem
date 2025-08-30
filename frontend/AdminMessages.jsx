import React, { useState } from "react";

function AdminMessages() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Mensagem de teste 1", date: "30/08/2025" },
    { id: 2, text: "Mensagem de teste 2", date: "29/08/2025" },
  ]);

  const deleteMessage = (id) => {
    setMessages(messages.filter((msg) => msg.id !== id));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>📩 Mensagens Recebidas</h1>

      {messages.length === 0 ? (
        <p>Nenhuma mensagem encontrada.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {messages.map((msg) => (
            <li
              key={msg.id}
              style={{
                background: "#f8f9fa",
                margin: "10px 0",
                padding: "10px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                <strong>{msg.date}</strong> - {msg.text}
              </span>
              <button
                onClick={() => deleteMessage(msg.id)}
                style={{
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}

      <a href="/admin" style={{ display: "block", marginTop: "20px" }}>
        ⬅ Voltar ao Painel
      </a>
    </div>
  );
}

export default AdminMessages;
