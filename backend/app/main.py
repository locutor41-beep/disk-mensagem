# app/main.py
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, HttpUrl
from datetime import date, time as dtime
from typing import Optional

import base64, io, qrcode
from docx import Document
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from sqlmodel import Session, select

from .config import settings
from .db import init_db, get_session
from .models import AdminUser, Category, Message, Order, Payment, AppSettings
from .auth import get_current_admin, create_access_token, hash_password, verify_password
from .payments.mpago import MercadoPagoPix

app = FastAPI(title=settings.APP_NAME, version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=(settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Startup: init tables & seed admin + basic data ----------------
@app.on_event("startup")
def on_startup():
    init_db()
    with Session(get_session.__wrapped__.__globals__['engine']) as session:  # access engine inside db module
        # Admin seed
        if not session.exec(select(AdminUser).where(AdminUser.email == "admin@diskmensagem.local")).first():
            session.add(AdminUser(email="admin@diskmensagem.local", password_hash=hash_password("admin123")))
        # Seed categories/messages if empty
        if session.exec(select(Category)).first() is None:
            cats = [
                Category(name="Aniversário"), Category(name="Amor"),
                Category(name="Reconciliação"), Category(name="Dia das Mães"),
                Category(name="Dia dos Pais")
            ]
            for c in cats: session.add(c)
            session.commit()
        # Settings seed
        if not session.exec(select(AppSettings)).first():
            session.add(AppSettings())
        session.commit()
            c_by_name = {c.name: c for c in session.exec(select(Category)).all()}
            # extra categories
            extras = ['Bodas', 'Amizade', 'Homenagem', 'Agradecimento', 'Infantil']
            for n in extras:
                session.add(Category(name=n))
            session.commit()
            c_by_name = {c.name: c for c in session.exec(select(Category)).all()}
            session.add(Message(category_id=c_by_name["Aniversário"].id, title="Aniversário – Clássica", body="Hoje é dia de festa! Que a alegria desta data se espalhe por todo o ano. Felicidades e muitas bênçãos!"))
            session.add(Message(category_id=c_by_name["Amor"].id, title="Amor – Romântica", body="Meu coração canta por você. Que nosso amor se faça presente em cada nota desta homenagem especial."))
            session.add(Message(category_id=c_by_name["Reconciliação"].id, title="Reconciliação – Novo Começo", body="Que esta mensagem seja ponte para o perdão e um recomeço cheio de respeito, carinho e esperança."))
            session.add(Message(category_id=c_by_name["Bodas"].id, title="Bodas – Amor Eterno", body="Celebramos o amor que atravessa o tempo. Que a união de vocês siga forte, com respeito, parceria e muitas conquistas."))
            session.add(Message(category_id=c_by_name["Amizade"].id, title="Amizade – Parceiros de Vida", body="Amigos são família que a vida nos permite escolher. Obrigado por caminhar comigo em cada passo."))
            session.add(Message(category_id=c_by_name["Homenagem"].id, title="Homenagem – Com Gratidão", body="Nossa voz ecoa para reconhecer seu esforço e dedicação. Você é inspiração para todos nós."))
            session.add(Message(category_id=c_by_name["Agradecimento"].id, title="Agradecimento – De Coração", body="Obrigado por fazer parte desta história. Sua presença e carinho fazem toda a diferença."))
            session.add(Message(category_id=c_by_name["Infantil"].id, title="Infantil – Parabéns Pequeno(a) Campeão(ã)", body="Hoje é dia de brincar, sorrir e sonhar alto! Que a alegria desta data ilumine todo o seu ano."))
        session.commit()
        # Settings seed
        if not session.exec(select(AppSettings)).first():
            session.add(AppSettings())
        session.commit()

# ---------------- Utils: EMVCo Pix w/ CRC16 ----------------
def _crc16_ccitt(data: bytes, poly=0x1021, init_val=0xFFFF) -> int:
    crc = init_val
    for b in data:
        crc ^= (b << 8) & 0xFFFF
        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ poly) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return crc & 0xFFFF

def _emv_kv(tag: str, value: str) -> str:
    length = f"{len(value):02d}"
    return f"{tag}{length}{value}"

def build_brcode_pix(key: str, name: str, city: str, amount: float, txid: str = "DISKMENSAGEM") -> str:
    payload_format = _emv_kv("00", "01")
    merchant_account = _emv_kv("26", _emv_kv("00", "BR.GOV.BCB.PIX") + _emv_kv("01", key))
    merchant_category = _emv_kv("52", "0000")
    transaction_currency = _emv_kv("53", "986")
    transaction_amount = _emv_kv("54", f"{amount:.2f}")
    country_code = _emv_kv("58", "BR")
    merchant_name = _emv_kv("59", name[:25])
    merchant_city = _emv_kv("60", city[:15])
    additional_data = _emv_kv("62", _emv_kv("05", txid[:25]))
    crc_placeholder = "6304"
    brcode_nocrc = (
        payload_format + _emv_kv("01", "12")
        + merchant_account + merchant_category + transaction_currency
        + transaction_amount + country_code + merchant_name + merchant_city
        + additional_data + crc_placeholder
    )
    crc = _crc16_ccitt(brcode_nocrc.encode("utf-8"))
    return brcode_nocrc + f"{crc:04X}"

# ---------------- Schemas ----------------
class OrderCreate(BaseModel):
    recipient_name: str
    sender_name: str
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    date: date
    time: dtime
    message_id: int
    youtube_intro_url: HttpUrl
    youtube_final_url: HttpUrl

class PixCreate(BaseModel):
    order_id: int

class CategoryIn(BaseModel):
    name: str
    is_active: bool = True

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
class MessageIn(BaseModel):
    category_id: int
    title: str
    body: str
    is_active: bool = True

# ---------------- Public endpoints ----------------
@app.get("/public/config")
def public_config(session: Session = Depends(get_session)):
    cfg = session.exec(select(AppSettings)).first()
    return {
        "base_price_cents": cfg.base_price_cents,
        "city_name": cfg.city_name,
        "whats_e164": cfg.whats_e164,
        "phone_display": cfg.phone_display,
        "app_name": settings.APP_NAME,
    }

@app.get("/public/categories")
def list_categories(session: Session = Depends(get_session)):
    cats = session.exec(select(Category).where(Category.is_active == True)).all()
    return [{"id": c.id, "name": c.name} for c in cats]

@app.get("/public/messages")
def list_messages(category_id: int | None = None, q: str | None = None, session: Session = Depends(get_session)):
    stmt = select(Message).where(Message.is_active == True)
    if category_id:
        stmt = stmt.where(Message.category_id == category_id)
    items = session.exec(stmt).all()
    if q:
        ql = q.lower()
        items = [m for m in items if ql in m.title.lower() or ql in m.body.lower()]
    return [{"id": m.id, "title": m.title, "snippet": (m.body[:160] + "...")} for m in items]

@app.post("/public/orders")
def create_order(payload: OrderCreate, session: Session = Depends(get_session)):
    # ensure message exists and active
    msg = session.get(Message, payload.message_id)
    if not msg or not msg.is_active:
        raise HTTPException(400, "Mensagem inválida")
        cfg = session.exec(select(AppSettings)).first()
    order = Order(
        recipient_name=payload.recipient_name,
        sender_name=payload.sender_name,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        date=payload.date,
        time=payload.time,
        message_id=payload.message_id,
        youtube_intro_url=str(payload.youtube_intro_url),
        youtube_final_url=str(payload.youtube_final_url),
        amount_cents=cfg.base_price_cents,
        status="pending"
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return {"order_id": order.id, "status": order.status, "amount_cents": order.amount_cents}


@app.post("/public/payments/pix")
def create_pix(payload: PixCreate, session: Session = Depends(get_session)):
    order = session.get(Order, payload.order_id)
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    amount = order.amount_cents / 100.0
    cfg = session.exec(select(AppSettings)).first()

    # Branch: PSP provider
    if settings.PSP_PROVIDER.lower() == "mercadopago" and settings.MPAGO_ACCESS_TOKEN:
        try:
            mp = MercadoPagoPix(settings.MPAGO_ACCESS_TOKEN)
            copia_cola, qr_b64 = mp.create_charge(order_id=order.id, amount=amount, description=f"Pedido #{order.id}")
            pay = Payment(order_id=order.id, brcode=copia_cola or "", amount_cents=order.amount_cents, status="pending")
            session.add(pay); session.commit(); session.refresh(pay)
            return {"order_id": order.id, "brcode": copia_cola, "qrcode_base64": qr_b64, "payment_id": pay.id, "provider": "mercadopago"}
        except Exception as e:
            raise HTTPException(502, f"Erro no provedor Pix: {e}")

    # Fallback: QR estático local
    brcode = build_brcode_pix(
        key=cfg.pix_key, name="Disk Mensagem",
        city=((cfg.city_name or 'CIDADE')[:9].upper()), amount=amount,
        txid=f"DM{order.id:06d}"
    )
    img = qrcode.make(brcode)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()

    pay = Payment(order_id=order.id, brcode=brcode, amount_cents=order.amount_cents, status="pending")
    session.add(pay); session.commit(); session.refresh(pay)
    return {"order_id": order.id, "brcode": brcode, "qrcode_base64": f"data:image/png;base64,{b64}", "payment_id": pay.id, "provider": "static"}

@app.get("/public/orders/{order_id}")
def order_status(order_id: int, session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    return {"id": order.id, "status": order.status}

# ---------------- Admin: auth ----------------
@app.post("/admin/login")
def admin_login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(AdminUser).where(AdminUser.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(401, "Credenciais inválidas")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# ---------------- Admin: categories ----------------
@app.get("/admin/categories")
def admin_list_categories(session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    return session.exec(select(Category)).all()

@app.post("/admin/categories")
def admin_create_category(data: CategoryIn, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    c = Category(name=data.name, is_active=data.is_active)
    session.add(c); session.commit(); session.refresh(c)
    return c

@app.put("/admin/categories/{cid}")
def admin_update_category(cid: int, data: CategoryIn, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    c = session.get(Category, cid)
    if not c: raise HTTPException(404, "Categoria não encontrada")
    c.name = data.name; c.is_active = data.is_active
    session.add(c); session.commit(); session.refresh(c)
    return c

@app.delete("/admin/categories/{cid}")
def admin_delete_category(cid: int, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    c = session.get(Category, cid)
    if not c: raise HTTPException(404, "Categoria não encontrada")
    session.delete(c); session.commit()
    return {"ok": True}

# ---------------- Admin: messages ----------------
@app.get("/admin/messages")
def admin_list_messages(session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    return session.exec(select(Message)).all()

@app.post("/admin/messages")
def admin_create_message(data: MessageIn, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    m = Message(**data.dict())
    session.add(m); session.commit(); session.refresh(m)
    return m

@app.put("/admin/messages/{mid}")
def admin_update_message(mid: int, data: MessageIn, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    m = session.get(Message, mid)
    if not m: raise HTTPException(404, "Mensagem não encontrada")
    m.category_id = data.category_id; m.title = data.title; m.body = data.body; m.is_active = data.is_active
    session.add(m); session.commit(); session.refresh(m)
    return m

@app.delete("/admin/messages/{mid}")
def admin_delete_message(mid: int, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    m = session.get(Message, mid)
    if not m: raise HTTPException(404, "Mensagem não encontrada")
    session.delete(m); session.commit()
    return {"ok": True}

# ---------------- Admin: orders ----------------
@app.get("/admin/orders")
def admin_list_orders(status: Optional[str] = None, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    stmt = select(Order)
    if status:
        stmt = stmt.where(Order.status == status)
    items = session.exec(stmt).all()
    return items

class StatusIn(BaseModel):
    status: str

@app.put("/admin/orders/{oid}/status")
def admin_update_order_status(oid: int, data: StatusIn, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    o = session.get(Order, oid)
    if not o: raise HTTPException(404, "Pedido não encontrado")
    o.status = data.status
    session.add(o); session.commit(); session.refresh(o)
    return {"id": o.id, "status": o.status}


# ---------------- Admin: change password ----------------
@app.post('/admin/change_password')
def admin_change_password(data: PasswordChange, session: Session = Depends(get_session), admin: AdminUser = Depends(get_current_admin)):
    if not verify_password(data.current_password, admin.password_hash):
        raise HTTPException(400, 'Senha atual incorreta')
    admin.password_hash = hash_password(data.new_password)
    session.add(admin); session.commit(); session.refresh(admin)
    return {'ok': True}


# ---------------- Admin: import messages from .docx ----------------
@app.post('/admin/messages/import-docx')
def admin_import_docx(file: UploadFile = File(...), session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    # Expected format (flexível):
    # Linhas do .docx com marcadores 'Categoria:', 'Título:' e o texto da mensagem até uma linha '---' ou nova 'Título:'
    content = file.file.read()
    from tempfile import NamedTemporaryFile
    with NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
        tmp.write(content); tmp_path = tmp.name
    doc = Document(tmp_path)
    import re
    current_cat = None
    current_title = None
    buffer = []
    def save_message(cat_name, title, body):
        if not title or not body: return 0
        # get or create category
        from sqlmodel import select
        cat = session.exec(select(Category).where(Category.name == cat_name)).first()
        if not cat:
            cat = Category(name=cat_name, is_active=True)
            session.add(cat); session.commit(); session.refresh(cat)
        m = Message(category_id=cat.id, title=title.strip(), body=body.strip(), is_active=True)
        session.add(m)
        return 1
    count = 0
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue
        if text.startswith('Categoria:'):
            # save pending
            if current_title and buffer and current_cat:
                count += save_message(current_cat, current_title, '\n'.join(buffer)); buffer=[]
            current_cat = text.split(':',1)[1].strip() or 'Sem Categoria'
            current_title = None
            continue
        if text.startswith('Título:') or text.startswith('Titulo:'):
            if current_title and buffer and current_cat:
                count += save_message(current_cat, current_title, '\n'.join(buffer)); buffer=[]
            current_title = text.split(':',1)[1].strip()
            continue
        if text.strip() == '---':
            if current_title and buffer and current_cat:
                count += save_message(current_cat, current_title, '\n'.join(buffer)); buffer=[]; current_title=None
            continue
        buffer.append(text)
    # final flush
    if current_title and buffer and current_cat:
        count += save_message(current_cat, current_title, '\n'.join(buffer))
    session.commit()
    return {'imported': count}


# ---------------- Webhook Pix (genérico) ----------------
@app.post('/webhooks/pix')
async def pix_webhook(payload: dict, x_webhook_token: str | None = Header(default=None), session: Session = Depends(get_session)):
    # Validação simples via token estático
    if x_webhook_token != settings.WEBHOOK_TOKEN:
        raise HTTPException(401, 'Token inválido')
    # Esperado: { 'order_id': 123, 'status': 'confirmed'|'failed' }
    order_id = payload.get('order_id')
    status = payload.get('status')
    if not order_id:
        raise HTTPException(400, 'order_id ausente')
    order = session.get(Order, int(order_id))
    if not order:
        raise HTTPException(404, 'Pedido não encontrado')
    if status == 'confirmed':
        order.status = 'paid'
        # Atualiza pagamentos relacionados
        from sqlmodel import select
        pays = session.exec(select(Payment).where(Payment.order_id == order.id)).all()
        for p in pays:
            p.status = 'confirmed'
            session.add(p)
    elif status == 'failed':
        from sqlmodel import select
        pays = session.exec(select(Payment).where(Payment.order_id == order.id)).all()
        for p in pays:
            p.status = 'failed'
            session.add(p)
    session.add(order); session.commit(); session.refresh(order)
    return {'ok': True, 'order_status': order.status}


# ---------------- Admin: settings ----------------
class SettingsIn(BaseModel):
    base_price_cents: int
    city_name: str
    pix_key: str
    whats_e164: str
    phone_display: str

@app.get("/admin/settings")
def admin_get_settings(session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    cfg = session.exec(select(AppSettings)).first()
    return cfg

@app.put("/admin/settings")
def admin_update_settings(data: SettingsIn, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    cfg = session.exec(select(AppSettings)).first()
    if not cfg:
        cfg = AppSettings()
    cfg.base_price_cents = data.base_price_cents
    cfg.city_name = data.city_name
    cfg.pix_key = data.pix_key
    cfg.whats_e164 = data.whats_e164
    cfg.phone_display = data.phone_display
    session.add(cfg); session.commit(); session.refresh(cfg)
    return cfg


# ---------------- Admin: agenda do dia (PDF) ----------------
@app.get("/admin/agenda/pdf")
def admin_agenda_pdf(date_str: str, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    from datetime import datetime
    try:
        day = datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(400, "Formato de data inválido (use YYYY-MM-DD)")

    items = session.exec(select(Order).where(Order.date == day)).all()
    # Generate PDF
    from fastapi.responses import Response
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    w, h = A4
    y = h - 20*mm
    c.setFont("Helvetica-Bold", 14)
    c.drawString(20*mm, y, f"Agenda — {day.isoformat()}")
    y -= 10*mm
    c.setFont("Helvetica", 10)
    if not items:
        c.drawString(20*mm, y, "Nenhum pedido para esta data.")
    for o in items:
        txt = f"#{o.id} — {o.time} — {o.recipient_name} (de {o.sender_name}) — {o.address} — Msg {o.message_id} — Status: {o.status}"
        for line in [txt[i:i+100] for i in range(0, len(txt), 100)]:
            if y < 20*mm:
                c.showPage(); y = h - 20*mm; c.setFont('Helvetica', 10)
            c.drawString(20*mm, y, line)
            y -= 6*mm
        y -= 4*mm
    c.showPage(); c.save()
    pdf = buffer.getvalue()
    return Response(content=pdf, media_type='application/pdf', headers={'Content-Disposition': f'inline; filename="agenda-{day.isoformat()}.pdf"'})
