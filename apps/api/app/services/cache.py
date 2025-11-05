from __future__ import annotations

import json
from datetime import date

import redis

from financeagent_shared import RankedSymbol, Recommendation

from app.config import settings

_redis_client: redis.Redis | None = None


def _get_client() -> redis.Redis | None:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
        except redis.RedisError:
            return None
    return _redis_client


def cache_pipeline_result(
    user_id: int,
    as_of: date,
    ranked: list[RankedSymbol],
    recommendation: Recommendation | None,
) -> None:
    client = _get_client()
    if client is None:
        return
    payload = {
        "ranked": [item.model_dump(mode="json") for item in ranked],
        "recommendation": recommendation.model_dump(mode="json") if recommendation else None,
    }
    try:
        client.set(f"user:{user_id}:daily:{as_of.isoformat()}", json.dumps(payload), ex=24 * 3600)
    except redis.RedisError:
        pass
