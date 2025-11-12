from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import redis

from app.config import settings
from app.db.session import SessionLocal

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, object]:
    checks: dict[str, str] = {}
    healthy = True

    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except SQLAlchemyError:
        checks["database"] = "error"
        healthy = False

    client: redis.Redis | None = None
    try:
        client = redis.from_url(
            settings.redis_url,
            socket_connect_timeout=2,
            socket_timeout=2,
            decode_responses=False,
        )
        client.ping()
        checks["redis"] = "ok"
    except redis.RedisError:
        checks["redis"] = "error"
        healthy = False
    finally:
        if client is not None:
            try:
                client.close()
            except redis.RedisError:
                pass

    return {
        "status": "ok" if healthy else "degraded",
        "healthy": healthy,
        "checks": checks,
    }
