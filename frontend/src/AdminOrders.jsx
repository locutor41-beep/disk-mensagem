import React, { useEffect, useState } from "react";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/orders`);
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Erro ao carregar pedidos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p>⏳ Carregando pedidos...</p>;

  if (!orders.length) return <p>Nenhum pedido encontrado.</p>;

  return (
    <div>
      <h2>📦 Lista de Pedidos</h2>
      <ul>
        {orders.map((order, idx) => (
          <li key={idx}>
            <strong>Cliente:</strong> {order.nome} <br />
            <strong>Mensagem:</strong> {order.mensagem} <br />
            <strong>Data:</strong> {order.data} <br />
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
}
