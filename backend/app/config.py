# app/config.py
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    BASE_PRICE_CENTS: int = 7000
    PIX_KEY: str = "+5518997053664"
    CITY_NAME: str = "Sua Cidade"
    WHATS_NUMBER_E164: str = "+5518997053664"
    PHONE_DISPLAY: str = "(18) 99705-3664"
    APP_NAME: str = "Disk Mensagem Stúdio Neil Marcos"

    # Segurança e integrações
    SECRET_KEY: str = Field("change-this-secret", env="SECRET_KEY")
    WEBHOOK_TOKEN: str = Field("troque-este-token", env="WEBHOOK_TOKEN")
    CORS_ORIGINS: str = Field("*", env="CORS_ORIGINS")  # separado por vírgula
    PSP_PROVIDER: str = Field("static", env="PSP_PROVIDER")  # static | mercadopago
    MPAGO_ACCESS_TOKEN: str = Field("", env="MPAGO_ACCESS_TOKEN")  # se usar mercadopago

settings = Settings()
