"""Request and response models."""

from __future__ import annotations

from pydantic import BaseModel


class Record(BaseModel):
    name: str
    description: str


class PromptRequest(BaseModel):
    prompt: str


class GenerateRequest(BaseModel):
    question: str
    records: list[Record]


class OllamaHealthResponse(BaseModel):
    status: str
    ollama_url: str
    available_models: list[str]


class ReplyResponse(BaseModel):
    reply: str
