"""Chat history storage (plain SQL, no ORM mapping)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def create_conversation(
    db: AsyncSession, *, title: str | None = None, user_id: str | None = None
) -> str:
    conversation_id = str(uuid.uuid4())
    await db.execute(
        text(
            'INSERT INTO "conversations" ("id", "user_id", "title") '
            "VALUES (:id, :user_id, :title)"
        ),
        {"id": conversation_id, "user_id": user_id, "title": title},
    )
    return conversation_id


async def conversation_exists(db: AsyncSession, conversation_id: str) -> bool:
    result = await db.execute(
        text('SELECT 1 FROM "conversations" WHERE "id" = :id'), {"id": conversation_id}
    )
    return result.first() is not None


async def add_message(
    db: AsyncSession, conversation_id: str, role: str, content: str
) -> None:
    await db.execute(
        text(
            'INSERT INTO "messages" ("id", "conversation_id", "role", "content") '
            "VALUES (:id, :conversation_id, :role, :content)"
        ),
        {
            "id": str(uuid.uuid4()),
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
        },
    )


async def recent_messages(
    db: AsyncSession, conversation_id: str, limit: int = 10
) -> list[dict[str, str]]:
    """Last `limit` messages, oldest first, shaped for the LLM."""
    result = await db.execute(
        text(
            'SELECT "role", "content" FROM "messages" '
            'WHERE "conversation_id" = :conversation_id '
            'ORDER BY "seq" DESC LIMIT :limit'
        ),
        {"conversation_id": conversation_id, "limit": limit},
    )
    rows = result.all()
    return [{"role": row.role, "content": row.content} for row in reversed(rows)]


async def all_messages(db: AsyncSession, conversation_id: str) -> list[dict[str, Any]]:
    result = await db.execute(
        text(
            'SELECT "id", "role", "content", "created_at" FROM "messages" '
            'WHERE "conversation_id" = :conversation_id ORDER BY "seq"'
        ),
        {"conversation_id": conversation_id},
    )
    return [dict(row._mapping) for row in result]


async def list_conversations(db: AsyncSession, limit: int = 50) -> list[dict[str, Any]]:
    result = await db.execute(
        text(
            'SELECT "id", "title", "created_at" FROM "conversations" '
            'ORDER BY "created_at" DESC LIMIT :limit'
        ),
        {"limit": limit},
    )
    return [dict(row._mapping) for row in result]
