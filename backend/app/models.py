# app/models.py
from typing import Optional
from datetime import datetime, date, time as dtime
from sqlmodel import SQLModel, Field, Relationship

class AdminUser(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    is_active: bool = Field(default=True)

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    category_id: int = Field(foreign_key="category.id", index=True)
    title: str
    body: str
    is_active: bool = Field(default=True)

class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    recipient_name: str
    sender_name: str
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    date: date
    time: dtime
    message_id: int = Field(foreign_key="message.id", index=True)
    youtube_intro_url: str
    youtube_final_url: str
    amount_cents: int
    status: str = Field(default="pending")  # pending|paid|scheduled|done|canceled
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id", index=True)
    method: str = Field(default="pix")
    brcode: str
    amount_cents: int
    status: str = Field(default="pending")  # pending|confirmed|failed
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AppSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=1, primary_key=True)
    base_price_cents: int = 7000
    city_name: str = "Sua Cidade"
    pix_key: str = "+5518997053664"
    whats_e164: str = "+5518997053664"
    phone_display: str = "(18) 99705-3664"
