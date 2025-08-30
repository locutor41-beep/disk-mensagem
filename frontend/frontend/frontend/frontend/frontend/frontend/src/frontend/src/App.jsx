import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import AdminLayout from './pages/AdminLayout.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminMessages from './pages/AdminMessages.jsx'
import AdminOrders from './pages/AdminOrders.jsx'

export default function App() {
  return (
    <Routes>
      {/* público */}
      <Route path="/" element={<Home />} />

      {/* admin: layout + rotas filhas */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="messages" replace />} />
        <Route path="login" element={<AdminLogin />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="orders" element={<AdminOrders />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
