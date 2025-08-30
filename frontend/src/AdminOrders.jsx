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

  return (
    <div>
      <h2>📋 Pedidos</h2>
      {orders.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ background: "#f2f2f2" }}>
              <th>ID</th>
              <th>Cliente</th>
              <th>Categoria</th>
              <th>Mensagem</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.nome || "—"}</td>
                <td>{order.categoria}</td>
                <td>{order.mensagem}</td>
                <td>{new Date(order.data).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
