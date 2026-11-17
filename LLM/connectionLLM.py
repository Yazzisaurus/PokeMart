import httpx
from config import OLLAMA_URL, CHAT_MODEL
from schemas import Record

SYSTEM_PROMPT = ("Testing") #Testing

# Connect Ollama to llama 3.1
def check_llm_connection():
    res = httpx.post(
        f"{OLLAMA_URL}/api/chat",
        json={
            "model": CHAT_MODEL,
            "messages": [{"role": "user", "content": "Reply with only: connected"}],
            "stream": False,
        },
        timeout=120.0,
    )
    res.raise_for_status()
    print("LLM reply:", res.json()["message"]["content"])

# Generate a sentence answer from the retrieved records
async def generate_answer(question: str, records: list[Record]) -> str:
    if not records:
        return "I couldn't find any matching records."

    context = "\n".join(f"- {r.name}: {r.description}" for r in records)
    payload = {
        "model": CHAT_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT.format(context=context)},
            {"role": "user", "content": question},
        ],
        "stream": False,
        "options": {"temperature": 0.2},
    }
    async with httpx.AsyncClient(timeout=httpx.Timeout(120, connect=5)) as client:
        res = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
        res.raise_for_status()
        return res.json()["message"]["content"].strip()

if __name__ == "__main__":
    check_llm_connection()