"""
query_executor.py — Safely executes validated SELECT queries on MySQL.

Uses SQLAlchemy's parameterized text() to prevent any SQL injection.
Returns results as a list of plain dicts for easy JSON serialization.
"""
import time
import logging
from typing import Any, Dict, List, Tuple

from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError, SQLAlchemyError

from ..database import SessionLocal

logger = logging.getLogger(__name__)


def execute_query(sql: str) -> Tuple[List[Dict[str, Any]], float]:
    """
    Execute a validated SELECT query and return results + timing.

    Args:
        sql: A validated (SELECT-only) SQL string. Must already be vetted
             by sql_validator.validate_sql() before reaching this function.

    Returns:
        Tuple of:
          - results: List of row dicts (column_name -> value)
          - elapsed: Execution time in seconds

    Raises:
        ValueError:       If the query is empty.
        OperationalError: If the database is unreachable.
        ProgrammingError: If the SQL has a syntax error.
        SQLAlchemyError:  For any other database-level error.
    """
    if not sql or not sql.strip():
        raise ValueError("Cannot execute an empty SQL query.")

    start = time.perf_counter()

    try:
        with SessionLocal() as session:
            result = session.execute(text(sql))
            columns = list(result.keys())
            rows = result.fetchall()

        elapsed = time.perf_counter() - start

        # Convert Row objects to plain dicts with JSON-serializable values
        results: List[Dict[str, Any]] = [
            {col: _serialize_value(val) for col, val in zip(columns, row)}
            for row in rows
        ]

        logger.info(
            f"Query executed in {elapsed:.3f}s — "
            f"{len(results)} rows returned."
        )
        return results, elapsed

    except OperationalError as e:
        elapsed = time.perf_counter() - start
        logger.error(f"Database operational error after {elapsed:.3f}s: {e}")
        raise OperationalError(
            statement=None,
            params=None,
            orig=Exception(
                "Could not connect to the database. "
                "Please check that MySQL is running and DATABASE_URL is correct."
            ),
        ) from e

    except ProgrammingError as e:
        elapsed = time.perf_counter() - start
        logger.error(f"SQL programming error after {elapsed:.3f}s: {e}")
        # Expose a cleaner error message
        raise ProgrammingError(
            statement=sql,
            params=None,
            orig=Exception(f"SQL syntax error: {e.orig}"),
        ) from e

    except SQLAlchemyError as e:
        elapsed = time.perf_counter() - start
        logger.error(f"SQLAlchemy error after {elapsed:.3f}s: {e}")
        raise


def _serialize_value(value: Any) -> Any:
    """
    Convert database types that aren't JSON-serializable into plain Python types.
    Handles: date, datetime, Decimal, bytes, etc.
    """
    import datetime
    import decimal

    if value is None:
        return None
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()
    if isinstance(value, decimal.Decimal):
        return float(value)
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value
