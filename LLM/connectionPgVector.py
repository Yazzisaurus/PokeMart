from http.client import HTTPException

import httpx
import numpy as np
import psycopg
from pgvector.psycopg import register_vector
from config import OLLAMA_URL, EMBED_MODEL, DB_URL

def check_pgvector_connection():
    # 1. Ollama turns text into a vector
    res = httpx.post(
        f"{OLLAMA_URL}/api/embed",
        json={"model": EMBED_MODEL, "input": "test"},
        timeout=30,
    )
    res.raise_for_status()
    vector = np.array(res.json()["embeddings"][0])
    print(len(vector))   # expect 768

# 2. Postgres/pgvector accepts that vector
    with psycopg.connect(DB_URL, autocommit=True) as conn:
        register_vector(conn)
        dims = conn.execute("SELECT vector_dims(%s::vector);", (vector,)).fetchone()[0]
        print(dims)

if __name__ == "__main__":
    try:
        check_pgvector_connection()
    except psycopg.OperationalError as e:
        raise HTTPException(e)
    except httpx.RequestError as e:
        raise HTTPException(e)