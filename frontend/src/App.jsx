function PriceNotice({ cfg }) {
  const price = (cfg.base_price_cents / 100).toFixed(2).replace('.', ',')
  const waMsg = encodeURIComponent('Olá! Quero consultar mensagem para outra cidade.')
  const whatsUrl = `https://wa.me/${cfg.whats_e164.replace('+','')}?text=${waMsg}`

  return (
    <div className="card">
      <div><span className="badge">Preço</span></div>
      <h2>Valor fixo: R$ {price}</h2>
      <p>Válido para mensagens em <b>{cfg.city_name}</b>.</p>
      <p>Para chácaras, sítios e outras cidades, consulte via WhatsApp ou ligação.</p>
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <a className="secondary button" href={whatsUrl} target="_blank" rel="noreferrer">
          <button>WhatsApp</button>
        </a>
        <a href={`tel:${cfg.whats_e164}`}>
          <button className="secondary">Ligar {cfg.phone_display}</button>
        </a>
      </div>
    </div>
  )
}
