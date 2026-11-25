"""Request and response models."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


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


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime


class ConversationOut(BaseModel):
    id: str
    title: str | None
    created_at: datetime
