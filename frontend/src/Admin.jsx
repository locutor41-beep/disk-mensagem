import React, { useEffect, useState } from 'react'

function useToken(){
  const [token,setToken] = useState(localStorage.getItem('adm_token') || '')
  const save = t => { setToken(t); localStorage.setItem('adm_token', t) }
  const clear = () => { setToken(''); localStorage.removeItem('adm_token') }
  return { token, save, clear }
}

function Login({ onLogin }){
  const [email,setEmail] = useState('admin@diskmensagem.local')
  const [password,setPassword] = useState('admin123')
  const [err,setErr] = useState('')
  async function submit(e){
    e.preventDefault()
    setErr('')
    const body = new URLSearchParams()
    body.set('username', email)
    body.set('password', password)
    body.set('grant_type','password')
    const res = await fetch(import.meta.env.VITE_API_URL + '/admin/login', { method:'POST', body })
    if(res.ok){
      const json = await res.json()
      onLogin(json.access_token)
    } else {
      setErr('Credenciais inválidas')
    }
  }
  return (
    <form onSubmit={submit} className="card" style={{maxWidth:420, margin:'40px auto'}}>
      <h2>Admin Login</h2>
      <label>E-mail</label>
      <input value={email} onChange={e=>setEmail(e.target.value)} />
      <label>Senha</label>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      {err && <div style={{color:'crimson', fontSize:13}}>{err}</div>}
      <button style={{marginTop:12}}>Entrar</button>
    </form>
  )
}

function Categories({ token }){
  const [items,setItems] = useState([])
  const [name,setName] = useState('')
  const [active,setActive] = useState(true)
  async function load(){
    const r = await fetch(import.meta.env.VITE_API_URL + '/admin/categories', { headers:{Authorization:'Bearer '+token}})
    setItems(await r.json())
  }
  useEffect(()=>{ load() }, [])

  async function add(){
    await fetch(import.meta.env.VITE_API_URL + '/admin/categories', {
      method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
      body: JSON.stringify({ name, is_active: active })
    })
    setName(''); setActive(true); load()
  }
  async function toggle(c){
    await fetch(import.meta.env.VITE_API_URL + '/admin/categories/'+c.id, {
      method:'PUT', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
      body: JSON.stringify({ name: c.name, is_active: !c.is_active })
    })
    load()
  }
  async function del(id){
    await fetch(import.meta.env.VITE_API_URL + '/admin/categories/'+id, {
      method:'DELETE', headers:{Authorization:'Bearer '+token}
    })
    load()
  }
  return (
    <div className="card">
      <h2>Categorias</h2>
      <div className="row">
        <div><input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} /></div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <label><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} /> Ativa</label>
          <button onClick={add}>Adicionar</button>
        </div>
      </div>
      <ul style={{listStyle:'none', padding:0, marginTop:12}}>
        {items.map(c=>(
          <li key={c.id} className="card" style={{padding:12, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>{c.name} {!c.is_active && <span className="badge">inativa</span>}</div>
            <div style={{display:'flex', gap:8}}>
              <button className="secondary" onClick={()=>toggle(c)}>{c.is_active?'Desativar':'Ativar'}</button>
              <button className="secondary" onClick={()=>del(c.id)}>Excluir</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Messages({ token }){
  const [items,setItems] = useState([])
  const [cats,setCats] = useState([])
  const [form,setForm] = useState({ category_id:'', title:'', body:'', is_active:true })

  async function load(){
    const [m,c] = await Promise.all([
      fetch(import.meta.env.VITE_API_URL + '/admin/messages', { headers:{Authorization:'Bearer '+token}}).then(r=>r.json()),
      fetch(import.meta.env.VITE_API_URL + '/admin/categories', { headers:{Authorization:'Bearer '+token}}).then(r=>r.json())
    ])
    setItems(m); setCats(c)
  }
  useEffect(()=>{ load() }, [])

  async function add(){
    const payload = { ...form, category_id: Number(form.category_id) }
    await fetch(import.meta.env.VITE_API_URL + '/admin/messages', {
      method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
      body: JSON.stringify(payload)
    })
    setForm({ category_id:'', title:'', body:'', is_active:true }); load()
  }
  async function del(id){
    await fetch(import.meta.env.VITE_API_URL + '/admin/messages/'+id, {
      method:'DELETE', headers:{Authorization:'Bearer '+token}
    }); load()
  }

  return (
    <div className="card">
      <h2>Mensagens</h2>
      <div className="row">
        <select value={form.category_id} onChange={e=>setForm({...form, category_id:e.target.value})}>
          <option value="">Categoria</option>
          {cats.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <input placeholder="Título" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
      </div>
      <div>
        <label>Texto</label>
        <textarea rows="4" style={{width:'100%', padding:10, border:'1px solid #cbd5e1', borderRadius:10}} value={form.body} onChange={e=>setForm({...form, body:e.target.value})}></textarea>
      </div>
      <div style={{display:'flex', gap:8, alignItems:'center', marginTop:8}}>
        <label><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form, is_active:e.target.checked})} /> Ativa</label>
        <button onClick={add}>Adicionar</button>
      </div>

      <ul style={{listStyle:'none', padding:0, marginTop:12, display:'grid', gap:8}}>
        {items.map(m=>(
          <li key={m.id} className="card" style={{padding:12}}>
            <div style={{fontWeight:600}}>{m.title} <span className="badge">#{m.id}</span></div>
            <div style={{fontSize:12, color:'#555'}}>Cat: {m.category_id} • {m.is_active ? 'ativa' : 'inativa'}</div>
            <div style={{whiteSpace:'pre-wrap', fontSize:13, marginTop:6}}>{m.body}</div>
            <button className="secondary" style={{marginTop:8}} onClick={()=>del(m.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Orders({ token }){
  const [items,setItems] = useState([])
  const [status,setStatus] = useState('')
  async function load(){
    const url = new URL(import.meta.env.VITE_API_URL + '/admin/orders')
    if(status) url.searchParams.set('status', status)
    const r = await fetch(url, { headers:{Authorization:'Bearer '+token}})
    setItems(await r.json())
  }
  useEffect(()=>{ load() }, [status])

  async function mark(id, s){
    await fetch(import.meta.env.VITE_API_URL + '/admin/orders/'+id+'/status', {
      method:'PUT', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
      body: JSON.stringify({ status: s })
    })
    load()
  }

  return (
    <div className="card">
      <h2>Pedidos</h2>
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <label>Status</label>
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">(todos)</option>
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="scheduled">scheduled</option>
          <option value="done">done</option>
          <option value="canceled">canceled</option>
        </select>
        <button className="secondary" onClick={load}>Atualizar</button>
      </div>
      <ul style={{listStyle:'none', padding:0, marginTop:12, display:'grid', gap:8}}>
        {items.map(o=>(
          <li key={o.id} className="card" style={{padding:12}}>
            <div><b>#{o.id}</b> — {o.recipient_name} (de {o.sender_name}) — {o.date} {o.time}</div>
            <div style={{fontSize:12, color:'#555'}}>Endereço: {o.address} | Mensagem #{o.message_id}</div>
            <div style={{fontSize:12}}>Status: <b>{o.status}</b> • Valor: R$ {(o.amount_cents/100).toFixed(2)}</div>
            <div style={{display:'flex', gap:6, marginTop:6}}>
              {['pending','paid','scheduled','done','canceled'].map(s=>(
                <button key={s} className="secondary" onClick={()=>mark(o.id, s)}>{s}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Admin(){
  const { token, save, clear } = useToken()
  const [tab,setTab] = useState('orders')

  if(!token) return <Login onLogin={save} />

  return (
    <div className="container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1>Admin — Disk Mensagem</h1>
        <div style={{display:'flex', gap:8}}>
          <button className="secondary" onClick={()=>setTab('orders')}>Pedidos</button>
          <button className="secondary" onClick={()=>setTab('categories')}>Categorias</button>
          <button className="secondary" onClick={()=>setTab('messages')}>Mensagens</button>
          <button className="secondary" onClick={()=>setTab('import')}>Importar .docx</button>
          <button className="secondary" onClick={()=>setTab('agenda')}>Agenda PDF</button>
          <button className="secondary" onClick={()=>setTab('settings')}>Configurações</button>
          <button className="secondary" onClick={()=>setTab('account')}>Conta</button>
          <button onClick={clear}>Sair</button>
        </div>
      </div>
      {tab==='orders' && <Orders token={token} />}

      {tab==='import' && <ImportDocx token={token} />}
      {tab==='agenda' && <AgendaExport token={token} />}
      {tab==='settings' && <SettingsTab token={token} />}
      {tab==='account' && <Account token={token} />}

    </div>
  )
}


function Account({ token }){
  const [current,setCurrent] = useState('')
  const [nw,setNw] = useState('')
  const [msg,setMsg] = useState('')
  async function change(){
    setMsg('')
    const r = await fetch(import.meta.env.VITE_API_URL + '/admin/change_password', {
      method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
      body: JSON.stringify({ current_password: current, new_password: nw })
    })
    if(r.ok) setMsg('Senha alterada com sucesso.'); else setMsg('Erro ao alterar senha.')
  }
  return (
    <div className="card">
      <h2>Conta</h2>
      <label>Senha atual</label>
      <input type="password" value={current} onChange={e=>setCurrent(e.target.value)} />
      <label>Nova senha</label>
      <input type="password" value={nw} onChange={e=>setNw(e.target.value)} />
      <button style={{marginTop:8}} onClick={change}>Trocar senha</button>
      {msg && <div style={{marginTop:8}}>{msg}</div>}
    </div>
  )
}

function ImportDocx({ token }){
  const [file,setFile] = useState(null)
  const [res,setRes] = useState('')
  async function upload(){
    const fd = new FormData(); fd.append('file', file)
    const r = await fetch(import.meta.env.VITE_API_URL + '/admin/messages/import-docx', {
      method:'POST', headers:{ Authorization:'Bearer '+token }, body: fd
    })
    setRes(r.ok ? 'Importado com sucesso.' : 'Falha ao importar.')
    try { const j = await r.json(); setRes(`${res}\n${JSON.stringify(j)}`) } catch {}
  }
  return (
    <div className="card">
      <h2>Importar Mensagens (.docx)</h2>
      <p style={{fontSize:13, color:'#555'}}>Formato esperado no arquivo: linhas iniciando com <b>Categoria:</b> e <b>Título:</b>, seguidas do texto da mensagem. Separe mensagens com uma linha contendo <code>---</code>.</p>
      <pre style={{background:'#f8fafc', padding:8, borderRadius:8}}>{`Categoria: Aniversário\nTítulo: Aniversário – Clássica\nHoje é dia de festa!...\n---\nCategoria: Amor\nTítulo: Amor – Romântica\nMeu coração canta por você...`}</pre>
      <input type="file" accept=".docx" onChange={e=>setFile(e.target.files[0])} />
      <button disabled={!file} style={{marginLeft:8}} onClick={upload}>Importar</button>
      {res && <div style={{marginTop:8, whiteSpace:'pre-wrap'}}>{res}</div>}
    </div>
  )
}


function SettingsTab({ token }){
  const [cfg,setCfg] = useState(null)
  const [msg,setMsg] = useState('')
  useEffect(()=>{ fetch(import.meta.env.VITE_API_URL + '/admin/settings', { headers:{Authorization:'Bearer '+token}}).then(r=>r.json()).then(setCfg) }, [])
  if(!cfg) return <div className="card">Carregando...</div>
  async function save(){
    setMsg('')
    const r = await fetch(import.meta.env.VITE_API_URL + '/admin/settings', {
      method:'PUT', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
      body: JSON.stringify(cfg)
    })
    setMsg(r.ok ? 'Salvo!' : 'Erro ao salvar')
  }
  return (
    <div className="card">
      <h2>Configurações</h2>
      <div className="row">
        <div>
          <label>Preço base (centavos)</label>
          <input value={cfg.base_price_cents} onChange={e=>setCfg({...cfg, base_price_cents: Number(e.target.value||0)})} />
        </div>
        <div>
          <label>Cidade</label>
          <input value={cfg.city_name} onChange={e=>setCfg({...cfg, city_name: e.target.value})} />
        </div>
      </div>
      <div className="row" style={{marginTop:8}}>
        <div>
          <label>Chave Pix (telefone / e-mail / aleatória)</label>
          <input value={cfg.pix_key} onChange={e=>setCfg({...cfg, pix_key: e.target.value})} />
        </div>
        <div>
          <label>WhatsApp (E.164)</label>
          <input value={cfg.whats_e164} onChange={e=>setCfg({...cfg, whats_e164: e.target.value})} />
        </div>
      </div>
      <div style={{marginTop:8}}>
        <label>Telefone exibido</label>
        <input value={cfg.phone_display} onChange={e=>setCfg({...cfg, phone_display: e.target.value})} />
      </div>
      <button style={{marginTop:12}} onClick={save}>Salvar</button>
      {msg && <div style={{marginTop:8}}>{msg}</div>}
    </div>
  )
}

function AgendaExport({ token }){
  const [date,setDate] = useState('')
  function openPdf(){
    if(!date) return
    const url = `${import.meta.env.VITE_API_URL}/admin/agenda/pdf?date_str=${date}`
    window.open(url, '_blank')
  }
  return (
    <div className="card">
      <h2>Agenda do dia (PDF)</h2>
      <div className="row">
        <div>
          <label>Data</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div style={{display:'flex', alignItems:'end'}}>
          <button onClick={openPdf}>Gerar PDF</button>
        </div>
      </div>
    </div>
  )
}
