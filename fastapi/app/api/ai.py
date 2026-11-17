"""Ollama routes."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException

from app.api.schemas import GenerateRequest, OllamaHealthResponse, PromptRequest, ReplyResponse
from app.core.config import settings
from app.services import llm

router = APIRouter()


@router.get("/ollama-health", response_model=OllamaHealthResponse, tags=["ai"])
async def check_ollama_connection() -> OllamaHealthResponse:
    try:
        models = await llm.list_models()
        return OllamaHealthResponse(
            status="connected",
            ollama_url=settings.ollama_url,
            available_models=models,
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Cannot connect to Ollama: {exc}") from exc


@router.post("/ask", response_model=ReplyResponse, tags=["ai"])
async def ask(request: PromptRequest) -> ReplyResponse:
    try:
        return ReplyResponse(reply=await llm.ask(request.prompt))
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Ollama request failed: {exc}") from exc


@router.post("/generate", response_model=ReplyResponse, tags=["ai"])
async def generate(req: GenerateRequest) -> ReplyResponse:
    try:
        return ReplyResponse(reply=await llm.generate_answer(req.question, req.records))
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Cannot reach Ollama") from None
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Ollama error: {exc.response.text}") from exc
