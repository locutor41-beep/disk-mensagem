import cfg from '../siteConfig.js'

export default function Home() {
  return (
    <div className="container">
      <img src="/logo.png" alt="Logo" className="logo" />
      <h1>Disk Mensagem</h1>
      <p>Bem-vindo ao seu aplicativo 🚀</p>

      <div className="card">
        <strong>Atendemos:</strong> {cfg.city_name}<br/>
        <strong>Contato:</strong> {cfg.phone_display}
      </div>

      <div className="card">
        <p>Área Administrativa:</p>
        <p>
          <a href="/admin/messages">/admin/messages</a> — Mensagens<br/>
          <a href="/admin/orders">/admin/orders</a> — Pedidos<br/>
          <a href="/admin/login">/admin/login</a> — Login (exemplo)
        </p>
      </div>
    </div>
  )
}
