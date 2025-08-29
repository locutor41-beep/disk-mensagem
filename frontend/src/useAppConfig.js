export async function fetchConfig(){
  try {
    const res = await fetch(import.meta.env.VITE_API_URL + '/public/config')
    return await res.json()
  } catch (e) {
    return {
      base_price_cents: 7000,
      city_name: 'Sua Cidade',
      whats_e164: '+5518997053664',
      phone_display: '(18) 99705-3664',
      app_name: 'Disk Mensagem'
    }
  }
}
