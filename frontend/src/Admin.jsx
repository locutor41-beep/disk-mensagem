import React from "react";
import AdminMessages from "./AdminMessages";
import AdminOrders from "./AdminOrders";

export default function Admin() {
  return (
    <div>
      <h1>Painel do Administrador</h1>
      <section>
        <h2>Mensagens</h2>
        <AdminMessages />
      </section>
      <section>
        <h2>Pedidos</h2>
        <AdminOrders />
      </section>
    </div>
  );
}
