"""
database.py — SQLAlchemy engine, session factory, and schema introspection.
"""
import os
from typing import Any, Dict, List
from sqlalchemy import create_engine, text, inspect as sa_inspect
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# ── Connection URL ──────────────────────────────────────────────────────────
# Format: mysql+pymysql://user:password@host:port/dbname
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "mysql+pymysql://root:@localhost:3306/sql_chatbot_db"
)

# ── Engine ──────────────────────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    echo=False,           # Set True to log all SQL to console (debug only)
    pool_pre_ping=True,   # Reconnect if connection dropped
    pool_recycle=300,     # Recycle connections every 5 min
    pool_size=5,
    max_overflow=10,
)

# ── Session factory ─────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ── Schema introspection ────────────────────────────────────────────────────

def get_db_schema() -> str:
    """
    Introspect the connected database and return a clean schema description
    suitable for use in AI prompts.

    Returns a multi-line string describing all tables and their columns.
    """
    try:
        inspector = sa_inspect(engine)
        tables = inspector.get_table_names()

        if not tables:
            return "(No tables found in database)"

        schema_parts = []

        for table in sorted(tables):
            columns = inspector.get_columns(table)
            col_lines = []

            for col in columns:
                col_type = str(col["type"])
                modifiers = []
                if col.get("primary_key"):
                    modifiers.append("PRIMARY KEY")
                if not col.get("nullable", True):
                    modifiers.append("NOT NULL")
                if col.get("autoincrement"):
                    modifiers.append("AUTO_INCREMENT")
                modifier_str = " " + " ".join(modifiers) if modifiers else ""
                col_lines.append(f"  {col['name']} {col_type}{modifier_str}")

            # Foreign keys
            try:
                fks = inspector.get_foreign_keys(table)
                for fk in fks:
                    local = ", ".join(fk["constrained_columns"])
                    ref_table = fk["referred_table"]
                    ref_cols = ", ".join(fk["referred_columns"])
                    col_lines.append(f"  -- FK: {local} -> {ref_table}({ref_cols})")
            except Exception:
                pass

            schema_parts.append(
                f"Table `{table}`:\n" + "\n".join(col_lines)
            )

        return "\n\n".join(schema_parts)

    except Exception as e:
        return f"(Schema introspection failed: {e})"


def get_table_names() -> List[str]:
    """Return list of all table names in the database."""
    try:
        inspector = sa_inspect(engine)
        return inspector.get_table_names()
    except Exception:
        return []


def test_connection() -> bool:
    """Ping the database. Returns True if the connection is alive."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"[DB] Connection error: {e}")
        return False
