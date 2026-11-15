import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# 1. Ports for the connections
FASTAPI_URL = "http://127.0.0.1:8000/docs/health"
OLLAMA_URL = "http://localhost:11435"

# 2. Create a base model for communication
class PromptRequest(BaseModel):
    prompt: str

# 3. Check FastAPI connection
@router.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "version": "0.1.0"}

# 4. Check FastAPI -> Ollama connection
@router.get("/ollama-health", tags=["ai"])
async def check_ollama_connection():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{OLLAMA_URL}/api/tags")
            res.raise_for_status()
            models = [m["name"] for m in res.json().get("models", [])]
            return {
                "status": "connected",
                "ollama_url": OLLAMA_URL,
                "available_models": models,
            }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Cannot connect to Ollama: {e}")


# 5. Send a request from FastAPI -> Ollama (llama3.1)
@router.post("/ask", tags=["ai"])
async def send_request_to_ollama(request: PromptRequest):
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": "llama3.1",
                    "messages": [{"role": "user", "content": request.prompt}],
                    "stream": False,
                },
            )
            response.raise_for_status()
            return {"reply": response.json()["message"]["content"]}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama request failed: {e}")