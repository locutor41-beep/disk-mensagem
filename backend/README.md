# Backend (FastAPI)

## Requisitos
- Python 3.11+
- (Opcional) virtualenv

## Instalar
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
```

## Rodar
```bash
uvicorn app.main:app --reload --port 8000
```
A API ficará em `http://localhost:8000`.
Documentação interativa: `http://localhost:8000/docs`.

> Este MVP usa armazenamento em memória. Em produção, substituir por banco de dados e PSP de Pix com webhook.
