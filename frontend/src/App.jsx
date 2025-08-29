import React, { useEffect, useState } from 'react'
import { fetchConfig } from './useAppConfig.js'
import Admin from './Admin.jsx'

function PriceNotice({ cfg }){
  const price = (cfg.base_price_cents/100).toFixed(2).replace('.',',')
  const waMsg = encodeURIComponent('Olá! Quero consultar mensagem para outra cidade.')
  const whatsUrl = `https://wa.me/${cfg.whats_e164.replace('+','')}?text=${waMsg}`

  return (
    <div className="card">
      <div><span className="badge">Preço</span></div>
      <h2>Valor fixo: R$ {price}</h2>
      <p>Válido para mensagens na <b>{cfg.city_name}</b>.</p>
      <p>Para <b>outras cidades</b>, consulte via WhatsApp ou ligação.</p>
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <a className="secondary button" href={whatsUrl} target="_blank" rel="noreferrer"><button>WhatsApp</button></a>
        <a href={`tel:${cfg.whats_e164}`}><button className="secondary">Ligar {cfg.phone_display}</button></a>
      </div>
    </div>
  )
}

function Messages({ categoryId, onPick }){
  const [items,setItems] = useState([])
  const [q,setQ] = useState('')
  useEffect(()=>{
    const url = new URL(import.meta.env.VITE_API_URL + '/public/messages')
    if(categoryId) url.searchParams.set('category_id', String(categoryId))
    if(q) url.searchParams.set('q', q)
    fetch(url).then(r=>r.json()).then(setItems)
  }, [categoryId, q])

  return (
    <div className="card">
      <label>Pesquisar mensagem</label>
      <input placeholder="Digite um tema..." value={q} onChange={e=>setQ(e.target.value)} />
      <ul style={{listStyle:'none', padding:0, marginTop:12, display:'grid', gap:8}}>
        {items.map(m=>(
          <li key={m.id} className="card" style={{padding:12}}>
            <div style={{fontWeight:600}}>{m.title}</div>
            <div className="no-select hide-copy" style={{fontSize:13, color:'#555'}}>{m.snippet}</div>
            <button style={{marginTop:8}} onClick={()=>onPick(m.id)}>Escolher esta</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function App(){
  const [cfg,setCfg] = useState(null)
  const [theme,setTheme] = useState(localStorage.getItem('theme') || 'system')
  useEffect(()=>{
    if(theme==='dark'){ document.documentElement.setAttribute('data-theme','dark') }
    else if(theme==='light'){ document.documentElement.setAttribute('data-theme','light') }
    else { document.documentElement.removeAttribute('data-theme') }
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggleTheme(){
    if(theme==='system') setTheme('dark')
    else if(theme==='dark') setTheme('light')
    else setTheme('system')
  }

  const [categoryId,setCategoryId] = useState('')
  const [messageId,setMessageId] = useState(null)
  const [introUrl,setIntroUrl] = useState('')
  const [finalUrl,setFinalUrl] = useState('')
  const [recipient,setRecipient] = useState('')
  const [sender,setSender] = useState('')
  const [address,setAddress] = useState('')
  const [date,setDate] = useState('')
  const [time,setTime] = useState('')
  const [orderId,setOrderId] = useState(null)
  const [pix,setPix] = useState(null)

  useEffect(()=>{ fetchConfig().then(setCfg) }, [])

  async function createOrder(){
    const payload = {
      recipient_name: recipient,
      sender_name: sender,
      address,
      date,
      time,
      message_id: messageId,
      youtube_intro_url: introUrl,
      youtube_final_url: finalUrl
    }
    const res = await fetch(import.meta.env.VITE_API_URL + '/public/orders', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    }).then(r=>r.json())
    setOrderId(res.order_id)
  }

  async function genPix(){
    const res = await fetch(import.meta.env.VITE_API_URL + '/public/payments/pix', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order_id: orderId })
    }).then(r=>r.json())
    setPix(res)
  }

  if(!cfg) return <div className="container">Carregando...</div>

  return (
    <div className="container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <button className="secondary" onClick={toggleTheme}>Tema: {theme}</button>
      </div>
      <div className="header-hero" style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
        <div style={{marginLeft:'auto'}} className="theme-toggle">
          <span>{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
          <input type="checkbox" checked={theme==='dark'} onChange={e=>setTheme(e.target.checked ? 'dark' : 'light')} />
        </div>
        <img src="/logo.png" className="logo" alt="Logo"/>
        <div>
          <h1>Disk Mensagem Stúdio Neil Marcos</h1>
          <div style={{fontSize:13, color:'#fff'}}>Mensagens com carro de som e gravação de mensagens</div>
        </div>
      </div>

      <PriceNotice cfg={cfg} />

      <div className="card">
        <h2>Agendar mensagem</h2>
        <label>Categoria</label>
        <select value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
          <option value="">Selecione</option>
          <option value="1">Aniversário</option>
          <option value="2">Amor</option>
          <option value="3">Reconciliação</option>
          <option value="4">Dia das Mães</option>
          <option value="5">Dia dos Pais</option>
        </select>
        {messageId ? <div style={{marginTop:8, fontSize:13, color:'#0a7'}}>Mensagem selecionada: #{messageId}</div> : <Messages categoryId={categoryId ? Number(categoryId): undefined} onPick={setMessageId}/>}

        <div className="row" style={{marginTop:12}}>
          <div>
            <label>Link da música de abertura (YouTube)</label>
            <input placeholder="https://youtu.be/..." value={introUrl} onChange={e=>setIntroUrl(e.target.value)} />
          </div>
          <div>
            <label>Link da música final (YouTube)</label>
            <input placeholder="https://youtu.be/..." value={finalUrl} onChange={e=>setFinalUrl(e.target.value)} />
          </div>
        </div>

        <div className="row" style={{marginTop:12}}>
          <div>
            <label>Quem recebe?</label>
            <input value={recipient} onChange={e=>setRecipient(e.target.value)} />
          </div>
          <div>
            <label>Quem envia?</label>
            <input value={sender} onChange={e=>setSender(e.target.value)} />
          </div>
        </div>

        <div style={{marginTop:12}}>
          <label>Endereço</label>
          <input value={address} onChange={e=>setAddress(e.target.value)} />
        </div>

        <div className="row" style={{marginTop:12}}>
          <div>
            <label>Dia</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div>
            <label>Hora</label>
            <input type="time" value={time} onChange={e=>setTime(e.target.value)} />
          </div>
        </div>

        {!orderId ? (
          <button style={{marginTop:12}} onClick={createOrder}>Continuar (gerar pedido)</button>
        ) : (
          <>
            <div style={{marginTop:8, fontSize:13}}>Pedido #{orderId} — Valor: R$ {(cfg.base_price_cents/100).toFixed(2)}</div>
            {!pix ? <button style={{marginTop:8}} onClick={genPix}>Gerar Pix</button> :
              <div className="card" style={{marginTop:12}}>
                <div className="badge">Pagamento Pix</div>
                <img src={pix.qrcode_base64} alt="QR Pix" className="qr" />
                <p style={{fontSize:12, wordBreak:'break-all'}}>Copia e cola: {pix.brcode}</p>
              </div>
            }
          </>
        )}
      </div>

      <footer>© {new Date().getFullYear()} Disk Mensagem Stúdio Neil Marcos</footer>
    </div>
  )
}
