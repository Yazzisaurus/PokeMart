import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import OLLAMA_URL, CHAT_MODEL
from schemas import PromptRequest, GenerateRequest, Record
from connectionLLM import generate_answer

router = APIRouter()

# Check FastAPI connection
@router.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "version": "0.1.0"}

# Check FastAPI -> Ollama connection
@router.get("/ollama-health", tags=["ai"])
async def check_ollama_connection():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{OLLAMA_URL}/api/tags")
            res.raise_for_status()
            models = [m["name"] for m in res.json().get("models", [])]
            return {"status": "connected", "ollama_url": OLLAMA_URL, "available_models": models}
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Cannot connect to Ollama: {e}")


# Send a request from FastAPI -> Ollama (llama3.1)
@router.post("/ask", tags=["ai"])
async def send_request_to_ollama(request: PromptRequest):
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(120, connect=5)) as client:
            res = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": CHAT_MODEL,
                    "messages": [{"role": "user", "content": request.prompt}],
                    "stream": False,
                },
            )
            res.raise_for_status()
            return {"reply": res.json()["message"]["content"]}
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Ollama request failed: {e}")

# Question and retrieved records with generated sentences
@router.post("/generate", tags=["ai"])
async def generate(req: GenerateRequest):
    try:
        return {"reply": await generate_answer(req.question, req.records)}
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Cannot reach Ollama")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Ollama error: {e.response.text}")