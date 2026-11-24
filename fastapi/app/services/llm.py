"""Ollama chat client."""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.ai.prompts import render_shopping_prompt
from app.ai.tools import ToolContext, ToolRegistry
from app.api.schemas import Record
from app.core.config import settings

MAX_TOOL_ROUNDS = 4


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
    """Answer a shopper message with the shopping prompt and tools."""
    return await complete(
        prompt,
        records=[],
    )


async def generate_answer(question: str, records: list[Record], history: list[dict[str, str]] | None = None,) -> str:
    """Generate a sentence answer from the retrieved records."""
    if not records:
        return "I couldn't find any matching records."
    return await complete(question, records=records, history=history)


async def complete(question: str, *, records: list[Record], history: list[dict[str, str]] | None = None) -> str:
    """Run a chat completion, executing tool calls until the model replies."""
    context = ToolContext(records=records)
    registry = ToolRegistry(context)
    messages: list[dict[str, Any]] = [
        {"role": "system", "content": render_shopping_prompt(records)}, *(history or []),
        {"role": "user", "content": question},
    ]
    message: dict[str, Any] = {}
    async with httpx.AsyncClient(timeout=httpx.Timeout(120, connect=5)) as client:
        for _ in range(MAX_TOOL_ROUNDS):
            message = await _chat(client, messages, registry.schemas())
            tool_calls = message.get("tool_calls") or []
            if not tool_calls:
                return str(message.get("content") or "").strip()
            messages.append(message)
            for call in tool_calls:
                function = call.get("function") or {}
                name = str(function.get("name") or "")
                result = await registry.dispatch(name, _arguments(function.get("arguments")))
                messages.append({"role": "tool", "content": result, "tool_name": name})
    content = str(message.get("content") or "").strip()
    return content or "I couldn't complete that request."


async def _chat(
    client: httpx.AsyncClient,
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]],
) -> dict[str, Any]:
    res = await client.post(
        f"{settings.ollama_url}/api/chat",
        json={
            "model": settings.chat_model,
            "messages": messages,
            "tools": tools,
            "stream": False,
            "options": {"temperature": 0.2},
        },
    )
    res.raise_for_status()
    message = res.json()["message"]
    if not isinstance(message, dict):
        return {"role": "assistant", "content": str(message)}
    return message


def _arguments(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return {}
        if isinstance(parsed, dict):
            return parsed
    return {}


if __name__ == "__main__":
    check_llm_connection()
