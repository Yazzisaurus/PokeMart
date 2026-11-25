"""Chat routes: converse with the assistant and read the chat backlog."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import ChatRequest, ChatResponse, ConversationOut, MessageOut
from app.core.exceptions import AppError, NotFoundError
from app.core.logger import get_logger
from app.db.session import get_db
from app.services import chat_store, llm, retrieval

logger = get_logger(__name__)
router = APIRouter(tags=["chat"])

HISTORY_LIMIT = 10
TITLE_LENGTH = 60


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, db: AsyncSession = Depends(get_db)) -> ChatResponse:
    try:
        records = await retrieval.search_products(db, req.message)
    except (httpx.HTTPStatusError, ProgrammingError):
        await db.rollback()
        records = []

    if req.conversation_id:
        if not await chat_store.conversation_exists(db, req.conversation_id):
            raise NotFoundError("Conversation not found")
        conversation_id = req.conversation_id
        history = await chat_store.recent_messages(db, conversation_id, HISTORY_LIMIT)
    else:
        conversation_id = await chat_store.create_conversation(
            db, title=req.message[:TITLE_LENGTH]
        )
        history = []

    try:
        reply = await llm.generate_answer(req.message, records, history=history)
    except httpx.RequestError as exc:
        logger.error("cannot reach Ollama: %s", exc)
        raise AppError("Cannot reach Ollama", status_code=503) from exc
    except httpx.HTTPStatusError as exc:
        raise AppError(f"Ollama error: {exc.response.text}", status_code=502) from exc

    # Saved only after a successful reply, so a failed call leaves no dangling rows.
    await chat_store.add_message(db, conversation_id, "user", req.message)
    await chat_store.add_message(db, conversation_id, "assistant", reply)
    await db.commit()
    return ChatResponse(conversation_id=conversation_id, reply=reply)


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(db: AsyncSession = Depends(get_db)) -> list[ConversationOut]:
    rows = await chat_store.list_conversations(db)
    return [ConversationOut(**row) for row in rows]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def get_conversation_messages(
    conversation_id: str, db: AsyncSession = Depends(get_db)
) -> list[MessageOut]:
    if not await chat_store.conversation_exists(db, conversation_id):
        raise NotFoundError("Conversation not found")
    rows = await chat_store.all_messages(db, conversation_id)
    return [MessageOut(**row) for row in rows]
