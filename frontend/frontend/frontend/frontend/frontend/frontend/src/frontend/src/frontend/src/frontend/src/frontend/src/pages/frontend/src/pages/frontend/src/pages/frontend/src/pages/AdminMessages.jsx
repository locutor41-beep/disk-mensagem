export default function AdminMessages() {
  const dummy = [
    { id: 1, name: 'Maria', text: 'Quero mensagem para aniversário.' },
    { id: 2, name: 'João',  text: 'Mensagem para casamento.' }
  ]
  return (
    <div>
      <h3>Mensagens</h3>
      {dummy.map(m => (
        <div key={m.id} className="card">
          <strong>{m.name}</strong>
          <p>{m.text}</p>
        </div>
      ))}
    </div>
  )
}
