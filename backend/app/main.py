"""
main.py — FastAPI application entry point for the AI SQL Chatbot backend.

Replaces the old RAG startup (document ingestion, vector store) with a
simple database connectivity check and environment validation on startup.
"""
from dotenv import load_dotenv
load_dotenv()  # Must load .env before importing anything that reads env vars

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import router as api_router
from .database import test_connection

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown hooks) ─────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup checks, then yield to serve requests, then shut down."""

    print("\n" + "=" * 60)
    print("  AI SQL Chatbot Backend v2.0")
    print("=" * 60)

    # Check database connection
    db_ok = test_connection()
    if db_ok:
        print("  [DB]     MySQL connection: OK")
    else:
        print("  [DB]     MySQL connection: FAILED")
        print("           Check DATABASE_URL in backend/.env")

    # Check OpenAI API key
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    if openai_key and openai_key.startswith("sk-"):
        print("  [OpenAI] API key: set")
    else:
        print("  [OpenAI] API key: MISSING or invalid")
        print("           Add OPENAI_API_KEY=sk-... to backend/.env")

    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    print(f"  [OpenAI] Model: {model}")
    print("  [Server] Ready - http://0.0.0.0:8001")
    print("=" * 60 + "\n")

    yield  # ← server is live here

    print("\n[SQL Chatbot] Server shutting down. Goodbye!")


# ── App factory ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI SQL Chatbot Backend",
    description=(
        "Text-to-SQL AI assistant. Ask questions in natural language "
        "and get answers from your MySQL database."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",      # Swagger UI at /docs
    redoc_url="/redoc",    # ReDoc at /redoc
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Allow all origins so the Next.js frontend (port 3000) can call the backend.
# In production, restrict allow_origins to your domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api")


# ── Root health check ─────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    """Simple liveness probe. Returns 200 OK when the server is running."""
    return {"status": "ok", "version": "2.0.0"}
