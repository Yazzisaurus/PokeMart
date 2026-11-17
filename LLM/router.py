import httpx
from fastapi import APIRouter, HTTPException
from config import OLLAMA_URL, CHAT_MODEL
from schemas import PromptRequest, GenerateRequest
from generation import generate_answer

router = APIRouter()

@router.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "version": "0.1.0"}

@router.get("/ollama-health", tags=["ai"])
async def check_ollama_connection():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{OLLAMA_URL}/api/tags")
            res.raise_for_status()
            models = [m["name"] for m in res.json().get("models", [])]
            return {"status": "connected", "ollama_url": OLLAMA_URL, "available_models": models}
    except httpx.RequestError as e:
        raise HTTPException(503, f"Cannot connect to Ollama: {e}")

@router.post("/ask", tags=["ai"])
async def ask(request: PromptRequest):
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(120, connect=5)) as client:
            res = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={"model": CHAT_MODEL,
                      "messages": [{"role": "user", "content": request.prompt}],
                      "stream": False},
            )
            res.raise_for_status()
            return {"reply": res.json()["message"]["content"]}
    except httpx.RequestError as e:
        raise HTTPException(503, f"Ollama request failed: {e}")

@router.post("/generate", tags=["ai"])
async def generate(req: GenerateRequest):
    try:
        return {"reply": await generate_answer(req.question, req.records)}
    except httpx.RequestError:
        raise HTTPException(503, "Cannot reach Ollama")
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"Ollama error: {e.response.text}")