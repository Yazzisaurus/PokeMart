"""Ollama chat client."""

from __future__ import annotations

import httpx

from app.api.schemas import Record
from app.core.config import settings

SYSTEM_PROMPT = "Testing"  # Testing


def check_llm_connection() -> None:
    """Send a one-word prompt to the chat model and print the reply."""
    res = httpx.post(
        f"{settings.ollama_url}/api/chat",
        json={
            "model": settings.chat_model,
            "messages": [{"role": "user", "content": "Reply with only: connected"}],
            "stream": False,
        },
        timeout=120.0,
    )
    res.raise_for_status()
    print("LLM reply:", res.json()["message"]["content"])


async def list_models() -> list[str]:
    """Return the model names reported by Ollama."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(f"{settings.ollama_url}/api/tags")
        res.raise_for_status()
        return [model["name"] for model in res.json().get("models", [])]


async def ask(prompt: str) -> str:
    """Send a single user prompt to the chat model."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(120, connect=5)) as client:
        res = await client.post(
            f"{settings.ollama_url}/api/chat",
            json={
                "model": settings.chat_model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
            },
        )
        res.raise_for_status()
        return res.json()["message"]["content"]


async def generate_answer(question: str, records: list[Record]) -> str:
    """Generate a sentence answer from the retrieved records."""
    if not records:
        return "I couldn't find any matching records."

    context = "\n".join(f"- {record.name}: {record.description}" for record in records)
    payload = {
        "model": settings.chat_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT.format(context=context)},
            {"role": "user", "content": question},
        ],
        "stream": False,
        "options": {"temperature": 0.2},
    }
    async with httpx.AsyncClient(timeout=httpx.Timeout(120, connect=5)) as client:
        res = await client.post(f"{settings.ollama_url}/api/chat", json=payload)
        res.raise_for_status()
        return res.json()["message"]["content"].strip()


if __name__ == "__main__":
    check_llm_connection()
