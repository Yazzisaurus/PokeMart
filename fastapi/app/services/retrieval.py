"""Embed a question with Ollama and fetch the closest products from pgvector."""

from __future__ import annotations

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import Record
from app.core.config import settings

# Adjust these if the existing pgvector table is named differently.
PRODUCTS_TABLE = "products"
NAME_COLUMN = "name"
DESCRIPTION_COLUMN = "description"
EMBEDDING_COLUMN = "embedding"
DEFAULT_LIMIT = 5


async def embed(value: str) -> list[float]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{settings.ollama_url}/api/embed",
            json={"model": settings.embed_model, "input": value},
        )
        res.raise_for_status()
        return res.json()["embeddings"][0]


async def search_products(
    db: AsyncSession, question: str, limit: int = DEFAULT_LIMIT
) -> list[Record]:
    """Return the products whose embeddings are closest (cosine) to the question."""
    vector = "[" + ",".join(str(x) for x in await embed(question)) + "]"
    # CAST(... AS text) first so any async driver sends it as a plain string.
    query = text(
        f'SELECT "{NAME_COLUMN}" AS name, "{DESCRIPTION_COLUMN}" AS description '
        f'FROM "{PRODUCTS_TABLE}" '
        f'ORDER BY "{EMBEDDING_COLUMN}" <=> CAST(CAST(:embedding AS text) AS vector) '
        "LIMIT :limit"
    )
    result = await db.execute(query, {"embedding": vector, "limit": limit})
    return [Record(name=row.name, description=row.description) for row in result]
