import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import App from './App'
import Admin from './Admin'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      {/* Site público (clientes) */}
      <Route path="/*" element={<App />} />

      {/* Painel admin */}
      <Route path="/admin/*" element={<Admin />} />
    </Routes>
  </BrowserRouter>
)
