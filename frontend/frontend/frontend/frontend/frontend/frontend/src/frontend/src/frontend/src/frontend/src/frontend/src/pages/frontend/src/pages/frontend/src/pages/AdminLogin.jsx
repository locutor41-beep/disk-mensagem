export default function AdminLogin() {
  return (
    <div className="card">
      <h3>Login do Admin (exemplo)</h3>
      <p>Integração real pode ser adicionada depois.</p>
      <form onSubmit={(e)=>{ e.preventDefault(); alert('Login fake :)'); }}>
        <div style={{marginBottom: 8}}>
          <label>Usuário<br/>
            <input type="text" placeholder="admin" />
          </label>
        </div>
        <div style={{marginBottom: 8}}>
          <label>Senha<br/>
            <input type="password" placeholder="••••••" />
          </label>
        </div>
        <button>Entrar</button>
      </form>
    </div>
  )
}
