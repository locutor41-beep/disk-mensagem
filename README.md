# Disk Mensagem Stúdio Neil Marcos — Starter

Este pacote contém:
- **backend/** FastAPI (Python) com geração de QR Pix (BR Code com CRC válido) e endpoints públicos
- **frontend/** React + Vite (PWA simples) consumindo a API

## Passo a passo rápido
1. **Backend**
   ```bash
   cd backend
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   # Linux/Mac: source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
2. **Frontend** (em um novo terminal)
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   npm run dev
   ```
3. Acesse: `http://localhost:5173`

> Valor fixo configurado em **R$ 70,00**. Altere em `backend/app/config.py` (BASE_PRICE_CENTS) e `CITY_NAME`.
> Integração Pix é QR estático com **CRC válido**; para confirmação automática, integrar a um PSP (Gerencianet/ASAAS/Mercado Pago etc.).


## Painel Admin (novo)
- Abra `http://localhost:5173/#/admin`
- Login padrão: **admin@diskmensagem.local** / **admin123** (troque em produção)
- Gerencie **Categorias**, **Mensagens** e **Pedidos** (atualize status)

> As tabelas estão em `backend/diskmensagem.db` (SQLite). Faça backup antes de atualizar.


### Novos recursos
- **Troca de senha do admin** em `/admin/change_password` (UI em `#/admin` → Aba **Conta**)
- **Importação de mensagens via .docx** em `/admin/messages/import-docx` (UI em `#/admin` → Aba **Importar .docx**)
  - Formato esperado (exemplo):
    ```
    Categoria: Aniversário
    Título: Aniversário – Clássica
    Hoje é dia de festa...
    ---
    Categoria: Amor
    Título: Amor – Romântica
    Meu coração canta por você...
    ```
- **Webhook Pix genérico** em `/webhooks/pix` com cabeçalho `X-Webhook-Token: <token>`
  - Configure o token em `backend/app/config.py` (campo `WEBHOOK_TOKEN`)
  - Envie JSON: `{ "order_id": 123, "status": "confirmed" }`


## Gerar APK (Capacitor + Android Studio)
1. **Frontend**: 
   ```bash
   cd frontend
   npm install
   npm run build:pwa
   npx cap sync
   npx cap open android
   ```
2. O Android Studio abrirá o projeto. Conecte um celular (modo desenvolvedor) ou use um emulador.
3. **Build > Build Bundle(s)/APK(s) > Build APK(s)**. O `.apk` sairá em `android/app/build/outputs/apk/debug/`.
4. Para **release** (assinada), crie uma keystore e gere o APK de release pelo Android Studio.

## Agenda do dia (PDF)
- Em `#/admin` → **Agenda PDF**, escolha a data e gere.
- Endpoint direto: `GET /admin/agenda/pdf?date_str=YYYY-MM-DD` (com Bearer token).

## Configurações no Admin
- Aba **Configurações**: edite **Preço (centavos)**, **Cidade**, **Chave Pix**, **WhatsApp** e **Telefone exibido** — sem mexer no código.


## Deploy rápido (sugestão)
### Backend no Render (Docker)
1. Crie um repositório no GitHub com estes arquivos (incluindo `Dockerfile` e `render.yaml`).
2. No Render, importe o repo e aponte para o `render.yaml` (Blueprint).
3. Defina os **Environment Variables**: `SECRET_KEY`, `WEBHOOK_TOKEN`, `CORS_ORIGINS`, `PSP_PROVIDER` e (se usar) `MPAGO_ACCESS_TOKEN`.
4. Ative um **disco** (já no blueprint) para persistir o banco SQLite.

### Frontend na Vercel
1. Importe o diretório `frontend` como projeto.
2. Crie a env `VITE_API_URL` apontando para seu backend (ex.: `https://seu-backend.onrender.com`).
3. Build command: `npm run build` • Output dir: `dist`.

### Pix com Mercado Pago (opcional)
- Defina `PSP_PROVIDER=mercadopago` e `MPAGO_ACCESS_TOKEN=seu_token` no backend.
- O endpoint `/public/payments/pix` passará a criar a cobrança via API do MP e retornar o QR do provedor.
- Ajuste o `/webhooks/pix` para consumir o evento do MP (posso adaptar para o formato exato depois que você tiver as credenciais).

### Arquivo de exemplo para importação de mensagens
- `backend/samples/mensagens-modelo.docx` (você também pode baixar: veja o link no chat).
