export default function AdminOrders() {
  const dummy = [
    { id: 101, customer: 'Ana',   total: 120 },
    { id: 102, customer: 'Paulo', total:  70 }
  ]
  return (
    <div>
      <h3>Pedidos</h3>
      {dummy.map(o => (
        <div key={o.id} className="card">
          <div><strong>Pedido:</strong> #{o.id}</div>
          <div><strong>Cliente:</strong> {o.customer}</div>
          <div><strong>Total:</strong> R$ {o.total},00</div>
        </div>
      ))}
    </div>
  )
}
