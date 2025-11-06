from __future__ import annotations

from functools import lru_cache
from typing import List, Tuple

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_weights(value: str) -> Tuple[float, float]:
    parts = value.split(",")
    if len(parts) != 2:
        raise ValueError("RANK_WEIGHTS must have two comma-separated values")
    return float(parts[0].strip()), float(parts[1].strip())


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    postgres_url: str = Field(..., alias="POSTGRES_URL")
    redis_url: str = Field(..., alias="REDIS_URL")

    perplexity_api_key: str | None = Field(default=None, alias="PERPLEXITY_API_KEY")
    perplexity_base_url: str = Field(default="https://api.perplexity.ai", alias="PERPLEXITY_BASE_URL")
    perplexity_model: str = Field(default="sonar", alias="PERPLEXITY_MODEL")
    yf_base_url: str = Field(default="https://query2.finance.yahoo.com", alias="YF_BASE_URL")
    kite_publisher_api_key: str | None = Field(default=None, alias="KITE_PUBLISHER_API_KEY")

    huge_correction_pct: float = Field(default=8.0, alias="HUGE_CORRECTION_PCT")
    rank_weights_raw: str = Field(default="0.6,0.4", alias="RANK_WEIGHTS")
    timezone: str = Field(default="Asia/Kolkata", alias="TIMEZONE")
    demo_mode: bool = Field(default=False, alias="DEMO_MODE")

    temporal_namespace: str = Field(default="default", alias="TEMPORAL_NAMESPACE")
    temporal_task_queue: str = Field(default="daily-pipeline", alias="TEMPORAL_TASK_QUEUE")
    temporal_address: str = Field(default="temporal:7233", alias="TEMPORAL_ADDRESS")

    auth_secret: str = Field(..., alias="AUTH_SECRET")
    token_expires_minutes: int = Field(default=60, alias="TOKEN_EXPIRES_MINUTES")
    cors_origins_raw: str | None = Field(default=None, alias="CORS_ORIGINS")

    @property
    def rank_weights(self) -> Tuple[float, float]:
        return parse_weights(self.rank_weights_raw)

    @property
    def cors_origins(self) -> List[str]:
        defaults = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        if not self.cors_origins_raw:
            return defaults
        custom = [
            origin.strip()
            for origin in self.cors_origins_raw.split(",")
            if origin.strip()
        ]
        return defaults + [origin for origin in custom if origin not in defaults]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
