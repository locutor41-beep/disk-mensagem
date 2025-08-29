from __future__ import annotations

# ===== Imports =====
import base64
import io
from datetime import date, datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from sqlmodel import Session, select

import qrcode
from docx import Document
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm

from .config import settings
from .db import engine, init_db, get_session
from .models import (
    AdminUser,
    Category,
    Message,
    Order,
    Payment,
    AppSettings,
)
from .auth import (
    get_current_admin,
    create_access_token,
    hash_password,
    verify_password,
)

# (opcional) provedor Pix Mercado Pago – só será usado se PSP_PROVIDER=mercadopago
try:
    from .payments.mpago import MercadoPagoPix
except Exception:  # pragma: no cover
    MercadoPagoPix = None  # type: ignore

# ===== App =====
app = FastAPI(title=settings.APP_NAME)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=(settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"]),
    allow_credentials=True,
    allow_methods=["*"],
    
    title: str
    body: str
    is_active: bool = True


class OrderIn(BaseModel):
    recipient_name: str
    sender_name: str
    address: str
    city: Optional[str] = None
    date: date
    time: str
    youtube_first: Optional[str] = None
    youtube_last: Optional[str] = None
    message_id: int


class PixCreate(BaseModel):
    order_id: int


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class SettingsIn(BaseModel):
    base_price_cents: int
    city_name: str
    pix_key: str
    whats_e164: str
    phone_display: str


# ===== Startup (DB + seed) =====
@app.on_event("startup")
def on_startup() -> None:
    init_db()
    with Session(engine) as session:
        # cria admin se não existir
        admin = session.exec(select(AdminUser).limit(1)).first()
        if not admin:
            admin = AdminUser(
                email="admin@diskmensagem.local",
                password_hash=hash_password("admin123"),
            )
            session.add(admin)
            session.commit()

        # categorias iniciais
        cats = session.exec(select(Category)).all()
        if not cats:
            base = [
                "Aniversário",
                "Amor",
                "Reconciliação",
                "Dia dos Pais",
                "Dia das Mães",
            ]
            for n in base:
                session.add(Category(name=n, is_active=True))
            session.commit()

        # Settings (tabela de configuração)
        if not session.exec(select(AppSettings)).first():
            session.add(AppSettings())
            session.commit()

        # mensagens de semente se ainda não houver nenhuma
        if not session.exec(select(Message)).first():
            c_by_name = {c.name: c for c in session.exec(select(Category)).all()}
            # categorias extras
            extras = ["Bodas", "Amizade", "Homenagem", "Agradecimento", "Infantil"]
            for n in extras:
                session.add(Category(name=n, is_active=True))
            session.commit()

            c_by_name = {c.name: c for c in session.exec(select(Category)).all()}

            session.add(
                Message(
                    category_id=c_by_name["Aniversário"].id,
                    title="Aniversário – Clássica",
                    body=(
                        "Hoje é dia de festa! Que a alegria desta data encha seu coração "
                        "de sorrisos e boas lembranças."
                    ),
                    is_active=True,
                )
            )
            session.add(
                Message(
                    category_id=c_by_name["Amor"].id,
                    title="Amor – Romântica",
                    body="Meu coração canta por você. Que esta mensagem leve meu carinho aonde você estiver.",
                    is_active=True,
                )
            )
            session.add(
                Message(
                    category_id=c_by_name["Reconciliação"].id,
                    title="Reconciliação – Novo Começo",
                    body="Que esta mensagem seja ponte para o perdão e um recomeço cheio de respeito, carinho e esperança.",
                    is_active=True,
                )
            )
            session.add(
                Message(
                    category_id=c_by_name["Bodas"].id,
                    title="Bodas – Amor Eterno",
                    body="Celebramos o amor que atravessa o tempo. Que a união de vocês siga forte, com respeito, parceria e muitas conquistas.",
                    is_active=True,
                )
            )
            session.add(
                Message(
                    category_id=c_by_name["Amizade"].id,
                    title="Amizade – Parceiros de Vida",
                    body="Amigos são família que a vida nos permite escolher. Obrigado por caminhar comigo em cada passo.",
                    is_active=True,
                )
            )
            session.add(
                Message(
                    category_id=c_by_name["Homenagem"].id,
                    title="Homenagem – Com Gratidão",
                    body="Nossa voz ecoa para reconhecer seu esforço e dedicação. Você é inspiração para todos nós.",
                    is_active=True,
                )
            )
            session.add(
                Message(
                    category_id=c_by_name["Agradecimento"].id,
                    title="Agradecimento – De Coração",
                    body="Obrigado por fazer parte desta história. Sua presença e carinho fazem toda a diferença.",
                    is_active=True,
                )
            )
            session.add(
                Message(
                    category_id=c_by_name["Infantil"].id,
                    title="Infantil – Parabéns Pequeno(a) Campeão(ã)",
                    body="Hoje é dia de brincar, sorrir e sonhar alto! Que a alegria desta data ilumine todo o seu ano.",
                    is_active=True,
                )
            )
            session.commit()


# ===== Utils: EMVCo Pix (copia-e-cola) =====
def _crc16(data: str) -> str:
    poly = 0x1021
    reg = 0xFFFF
    for ch in data.encode("utf-8"):
        reg ^= ch << 8
        for _ in range(8):
            if reg & 0x8000:
                reg = (reg << 1) ^ poly
            else:
                reg <<= 1
            reg &= 0xFFFF
    return f"{reg:04X}"


def build_brcode_pix(*, key: str, name: str, city: str, amount: float, txid: str) -> str:
    """
    Gera BR Code Pix estático com CRC16 conforme EMVCo + Febraban
    """
    # IDs
    payload_format = "000201"
    merchant_account = (
        "0014BR.GOV.BCB.PIX"  # gui
        + f"01{len(key):02d}{key}"  # chave
    )
    meaid = f"26{len(merchant_account):02d}{merchant_account}"
    merchant_cat = "52040000"
    currency = "5303986"  # BRL
    amount_str = f"{amount:.2f}"
    amount_field = f"54{len(amount_str):02d}{amount_str}"
    country = "5802BR"
    name_field = f"59{len(name):02d}{name}"
    city_field = f"60{len(city):02d}{city}"
    addl = f"62{len('05'+f'{len(txid):02d}'+txid):02d}" + f"05{len(txid):02d}{txid}"
    base = payload_format + meaid + merchant_cat + currency + amount_field + country + name_field + city_field + addl + "6304"
    crc = _crc16(base)
    return base + crc


# ===== Auth/Admin =====
@app.post("/admin/login")
def admin_login(payload: LoginIn, session: Session = Depends(get_session)):
    user = session.exec(select(AdminUser).where(AdminUser.email == payload.email)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Credenciais inválidas")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/admin/change_password")
def admin_change_password(
    data: PasswordChange,
    session: Session = Depends(get_session),
    admin: AdminUser = Depends(get_current_admin),
):
    if not verify_password(data.current_password, admin.password_hash):
        raise HTTPException(400, "Senha atual incorreta")
    admin.password_hash = hash_password(data.new_password)
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return {"ok": True}


# ===== Admin: Categorias/Mensagens =====
@app.get("/admin/categories")
def admin_list_categories(session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    return session.exec(select(Category)).all()


@app.post("/admin/categories")
def admin_create_category(
    data: CategoryIn, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)
):
    c = Category(**data.dict())
    session.add(c)
    session.commit()
    session.refresh(c)
    return c


@app.put("/admin/categories/{category_id}")
def admin_update_category(
    category_id: int, data: CategoryIn, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)
):
    c = session.get(Category, category_id)
    if not c:
        raise HTTPException(404, "Categoria não encontrada")
    for k, v in data.dict().items():
        setattr(c, k, v)
    session.add(c)
    session.commit()
    session.refresh(c)
    return c


@app.get("/admin/messages")
def admin_list_messages(session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    return session.exec(select(Message)).all()


@app.post("/admin/messages")
def admin_create_message(
    data: MessageIn, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)
):
    m = Message(**data.dict())
    session.add(m)
    session.commit()
    session.refresh(m)
    return m


@app.put("/admin/messages/{message_id}")
def admin_update_message(
    message_id: int, data: MessageIn, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)
):
    m = session.get(Message, message_id)
    if not m:
        raise HTTPException(404, "Mensagem não encontrada")
    for k, v in data.dict().items():
        setattr(m, k, v)
    session.add(m)
    session.commit()
    session.refresh(m)
    return m


# ===== Admin: Importar mensagens via .docx =====
@app.post("/admin/messages/import-docx")
def admin_import_docx(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    _: AdminUser = Depends(get_current_admin),
):
    """
    Formato esperado no .docx (texto):
      Categoria: Aniversário
      Título: Aniversário – Clássica
      O corpo da mensagem...
      ---
    """
    raw = file.file.read()
    tmp = io.BytesIO(raw)
    doc = Document(tmp)

    current_cat: Optional[str] = None
    current_title: Optional[str] = None
    buffer: List[str] = []
    imported = 0

    def flush():
        nonlocal imported, current_cat, current_title, buffer
        if not current_cat or not current_title or not buffer:
            return
        cat = session.exec(select(Category).where(Category.name == current_cat)).first()
        if not cat:
            cat = Category(name=current_cat, is_active=True)
            session.add(cat)
            session.commit()
            session.refresh(cat)
        m = Message(
            category_id=cat.id,
            title=current_title.strip(),
            body="\n".join(buffer).strip(),
            is_active=True,
        )
        session.add(m)
        imported += 1
        buffer = []
        current_title = None

    for p in doc.paragraphs:
        t = (p.text or "").strip()
        if not t:
            continue
        if t.startswith("Categoria:"):
            flush()
            current_cat = t.split(":", 1)[1].strip() or "Sem Categoria"
            continue
        if t.startswith("Título:") or t.startswith("Titulo:"):
            flush()
            current_title = t.split(":", 1)[1].strip()
            continue
        if t == "---":
            flush()
            continue
        buffer.append(t)

    flush()
    session.commit()
    return {"imported": imported}


# ===== Admin: Settings (preço, cidade, pix, contato) =====
@app.get("/admin/settings")
def admin_get_settings(session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)):
    return session.exec(select(AppSettings)).first()


@app.put("/admin/settings")
def admin_update_settings(
    data: SettingsIn, session: Session = Depends(get_session), _: AdminUser = Depends(get_current_admin)
):
    cfg = session.exec(select(AppSettings)).first()
    if not cfg:
        cfg = AppSettings()
    cfg.base_price_cents = data.base_price_cents
    cfg.city_name = data.city_name
    cfg.pix_key = data.pix_key
    cfg.whats_e164 = data.whats_e164
    cfg.phone_display = data.phone_display
    session.add(cfg)
    session.commit()
    session.refresh(cfg)
    return cfg


# ===== Admin: Agenda do dia (PDF) =====
@app.get("/admin/agenda/pdf")
def admin_agenda_pdf(
    date_str: str,
    session: Session = Depends(get_session),
    _: AdminUser = Depends(get_current_admin),
):
    try:
        day = datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(400, "Formato de data inválido (use YYYY-MM-DD)")

    items = session.exec(select(Order).where(Order.date == day)).all()

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    y = h - 20 * mm
    c.setFont("Helvetica-Bold", 14)
    c.drawString(20 * mm, y, f"Agenda — {day.isoformat()}")
    y -= 10 * mm
    c.setFont("Helvetica", 10)

    if not items:
        c.drawString(20 * mm, y, "Nenhum pedido para esta data.")
    for o in items:
        line = (
            f"#{o.id} — {o.time} — {o.recipient_name} (de {o.sender_name}) — "
            f"{o.address} — Msg {o.message_id} — Status: {o.status}"
        )
        for chunk in [line[i : i + 100] for i in range(0, len(line), 100)]:
            if y < 20 * mm:
                c.showPage()
                y = h - 20 * mm
                c.setFont("Helvetica", 10)
            c.drawString(20 * mm, y, chunk)
            y -= 6 * mm
        y -= 4 * mm

    c.showPage()
    c.save()
    pdf = buf.getvalue()
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="agenda-{day.isoformat()}.pdf"'},
    )


# ===== Público: config, categorias, mensagens, pedidos =====
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
def public_categories(session: Session = Depends(get_session)):
    return session.exec(select(Category).where(Category.is_active == True)).all()


@app.get("/public/messages")
def public_messages(category_id: Optional[int] = None, session: Session = Depends(get_session)):
    q = select(Message).where(Message.is_active == True)
    if category_id:
        q = q.where(Message.category_id == category_id)
    return session.exec(q).all()


@app.post("/public/orders")
def create_order(payload: OrderIn, session: Session = Depends(get_session)):
    cfg = session.exec(select(AppSettings)).first()
    order = Order(
        recipient_name=payload.recipient_name,
        sender_name=payload.sender_name,
        address=payload.address,
        city=payload.city or cfg.city_name,
        date=payload.date,
        time=payload.time,
        youtube_first=payload.youtube_first,
        youtube_last=payload.youtube_last,
        message_id=payload.message_id,
        status="pending",
        amount_cents=cfg.base_price_cents,
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return order


@app.get("/public/orders/{order_id}")
def get_order(order_id: int, session: Session = Depends(get_session)):
    o = session.get(Order, order_id)
    if not o:
        raise HTTPException(404, "Pedido não encontrado")
    return o


# ===== Pagamentos (Pix) =====
@app.post("/public/payments/pix")
def create_pix(payload: PixCreate, session: Session = Depends(get_session)):
    order = session.get(Order, payload.order_id)
    if not order:
        raise HTTPException(404, "Pedido não encontrado")

    amount = order.amount_cents / 100.0
    cfg = session.exec(select(AppSettings)).first()

    # Provedor externo (Mercado Pago) se configurado
    if (settings.PSP_PROVIDER or "").lower() == "mercadopago" and settings.MPAGO_ACCESS_TOKEN and MercadoPagoPix:
        try:
            mp = MercadoPagoPix(settings.MPAGO_ACCESS_TOKEN)
            copia_cola, qr_b64 = mp.create_charge(
                order_id=order.id, amount=amount, description=f"Pedido #{order.id}"
            )
            pay = Payment(order_id=order.id, brcode=copia_cola or "", amount_cents=order.amount_cents, status="pending")
            session.add(pay)
            session.commit()
            session.refresh(pay)
            return {
                "order_id": order.id,
                "brcode": copia_cola,
                "qrcode_base64": qr_b64,
                "payment_id": pay.id,
                "provider": "mercadopago",
            }
        except Exception as e:  # pragma: no cover
            raise HTTPException(502, f"Erro no provedor Pix: {e}")

    # Fallback: QR Pix estático local
    brcode = build_brcode_pix(
        key=cfg.pix_key,
        name="Disk Mensagem",
        city=((cfg.city_name or "CIDADE")[:9].upper()),
        amount=amount,
        txid=f"DM{order.id:06d}",
    )
    img = qrcode.make(brcode)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()

    pay = Payment(order_id=order.id, brcode=brcode, amount_cents=order.amount_cents, status="pending")
    session.add(pay)
    session.commit()
    session.refresh(pay)
    return {
        "order_id": order.id,
        "brcode": brcode,
        "qrcode_base64": f"data:image/png;base64,{b64}",
        "payment_id": pay.id,
        "provider": "static",
    }


# ===== Webhook Pix (genérico) =====
@app.post("/webhooks/pix")
def pix_webhook(
    payload: dict,
    x_webhook_token: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    if x_webhook_token != settings.WEBHOOK_TOKEN:
        raise HTTPException(401, "Token inválido")

    order_id = payload.get("order_id")
    status = payload.get("status")
    if not order_id:
        raise HTTPException(400, "order_id ausente")

    order = session.get(Order, int(order_id))
    if not order:
        raise HTTPException(404, "Pedido não encontrado")

    if status == "confirmed":
        order.status = "paid"
        pays = session.exec(select(Payment).where(Payment.order_id == order.id)).all()
        for p in pays:
            p.status = "confirmed"
            session.add(p)
    elif status == "failed":
        pays = session.exec(select(Payment).where(Payment.order_id == order.id)).all()
        for p in pays:
            p.status = "failed"
            session.add(p)

    session.add(order)
    session.commit()
    session.refresh(order)
    return {"ok": True, "order_status": order.status}
