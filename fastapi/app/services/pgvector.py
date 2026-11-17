"""Ollama embedding and pgvector connection check."""

from __future__ import annotations

from http.client import HTTPException

import httpx
import numpy as np
import psycopg
from pgvector.psycopg import register_vector

from app.core.config import settings


def check_pgvector_connection() -> None:
    """Embed a test string and confirm Postgres accepts the vector."""
    res = httpx.post(
        f"{settings.ollama_url}/api/embed",
        json={"model": settings.embed_model, "input": "test"},
        timeout=30,
    )
    res.raise_for_status()
    vector = np.array(res.json()["embeddings"][0])
    print(len(vector))  # expect 768

    with psycopg.connect(settings.db_url, autocommit=True) as conn:
        register_vector(conn)
        dims = conn.execute("SELECT vector_dims(%s::vector);", (vector,)).fetchone()[0]
        print(dims)


if __name__ == "__main__":
    try:
        check_pgvector_connection()
    except psycopg.OperationalError as exc:
        raise HTTPException(exc) from exc
    except httpx.RequestError as exc:
        raise HTTPException(exc) from exc
