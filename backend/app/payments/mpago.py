# app/payments/mpago.py
import httpx, base64

class MercadoPagoPix:
    def __init__(self, access_token: str):
        self.base = "https://api.mercadopago.com"
        self.headers = {"Authorization": f"Bearer {access_token}", "Content-Type":"application/json"}

    def create_charge(self, order_id: int, amount: float, description: str = "Disk Mensagem"):
        # DOC: Consulte a documentação oficial do Mercado Pago Pix para payload exato e campos suportados.
        # Aqui é um exemplo simplificado.
        payload = {
            "transaction_amount": round(amount, 2),
            "description": description,
            "payment_method_id": "pix",
            "external_reference": f"order-{order_id}"
        }
        url = f"{self.base}/v1/payments"
        with httpx.Client(timeout=30) as client:
            r = client.post(url, headers=self.headers, json=payload)
        r.raise_for_status()
        data = r.json()
        # Estrutura de resposta varia; procurar em data['point_of_interaction']['transaction_data']
        t = data.get("point_of_interaction", {}).get("transaction_data", {})
        qr_base64 = t.get("qr_code_base64")  # imagem do QR
        copia_cola = t.get("qr_code")        # texto copia-e-cola
        return copia_cola, (f"data:image/png;base64,{qr_base64}" if qr_base64 else None)
