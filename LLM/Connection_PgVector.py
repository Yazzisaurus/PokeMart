import psycopg
from pgvector.psycopg import register_vector
import requests

#Ports for the connection
OLLAMA_URL = "http://localhost:11435"
DB_URL = "postgresql://pokemart:pokemart@localhost:5432/pokemart"
EMBED_MODEL = "nomic-embed-text"

# Connect to PostgreSQL + pgvector_connection
try:
    with psycopg.connect(DB_URL, autocommit=True) as conn:
        if conn and not conn.closed:

            # Verify pgvector extension
            conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            register_vector(conn)
            print("Database connected:")

            # Ollama tries to change text to vector
            res = requests.post(
                f"{OLLAMA_URL}/api/embed",
                json={"model": EMBED_MODEL, "input": "Hyper Potion restores 120 HP"},
                timeout=10,
            )
            res.raise_for_status()
            vector = res.json()["embeddings"][0]
            print(f"4. Ollama generated vector (length: {len(vector)})")

            # Verify pgvector accepts the vector from Ollama
            dims = conn.execute(
                "SELECT vector_dims(%s::vector);",
                (vector,)
            ).fetchone()[0]
            print(f"Ollama -> pgvector verified (Postgres read {dims} dimensions)")

except psycopg.OperationalError as e:
    print("Database connection failed:", e)
except requests.RequestException as e:
    print("Ollama connection failed:", e)
except Exception as e:
    print("Check failed:", e)