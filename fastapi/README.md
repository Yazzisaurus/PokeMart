# fastapi

A production-ready FastAPI service scaffold.

## Quick Start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload
```

## Structure

```
app/
  api/
  core/
  db/
  services/
  main.py
```
