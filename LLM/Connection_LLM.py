import httpx

OLLAMA_URL = "http://localhost:11435"

# Connect Ollama to llama 3.1
chat_res = httpx.post(
    f"{OLLAMA_URL}/api/chat",
    json={
        "model": "llama3.1",
        "messages": [{"role": "user", "content": "Reply with only: connected"}],
        "stream": False,
    },
    timeout=60.0,
)
print("Ollama (llama3.1) connected:", chat_res.json()["message"]["content"].strip())