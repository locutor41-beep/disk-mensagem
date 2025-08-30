import React, { useState } from "react";

function AdminOrders() {
  const [orders, setOrders] = useState([
    { id: 1, client: "João Silva", service: "Mensagem Personalizada", status: "Pendente" },
    { id: 2, client: "Maria Souza", service: "Mensagem de Aniversário", status: "Concluído" },
  ]);

  const updateStatus = (id, newStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>📦 Pedidos</h1>

      {orders.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {orders.map((order) => (
            <li
              key={order.id}
              style={{
                background: "#f1f1f1",
                margin: "10px 0",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              <p>
                <strong>Cliente:</strong> {order.client}
              </p>
              <p>
                <strong>Serviço:</strong> {order.service}
              </p>
              <p>
                <strong>Status:</strong> {order.status}
              </p>

              <button
                onClick={() => updateStatus(order.id, "Concluído")}
                style={{
                  background: "green",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  marginRight: "10px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Marcar Concluído
              </button>

              <button
                onClick={() => updateStatus(order.id, "Pendente")}
                style={{
                  background: "orange",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Reabrir
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

export default AdminOrders;
