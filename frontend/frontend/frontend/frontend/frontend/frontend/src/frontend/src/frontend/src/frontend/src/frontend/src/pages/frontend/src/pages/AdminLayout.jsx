import { Outlet, Link } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="container">
      <header>
        <h2>Admin • Disk Mensagem</h2>
        <nav>
          <Link to="/admin/messages">Mensagens</Link>
          <Link to="/admin/orders">Pedidos</Link>
          <Link to="/admin/login">Login</Link>
          <Link to="/">Voltar ao site</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
