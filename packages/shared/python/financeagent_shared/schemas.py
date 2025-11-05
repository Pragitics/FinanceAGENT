from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class WatchlistCreate(BaseModel):
    symbol: str
    exchange: str | None = None


class WatchlistItem(WatchlistCreate):
    user_id: int
    id: int
    added_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NewsHeadline(BaseModel):
    id: int | None = None
    symbol: str
    source: str
    headline: str
    url: str
    published_at: datetime
    sentiment_score: float | None = None
    summary: str | None = None
    raw_json: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)


class DailyScore(BaseModel):
    id: int | None = None
    symbol: str
    date: date
    price_change_pct: float
    sentiment_score: float
    bias_score: float
    rank: int

    model_config = ConfigDict(from_attributes=True)


class RankedSymbol(BaseModel):
    symbol: str
    opportunity_score: float
    price_change_pct: float
    last_price: float | None = None
    sentiment_score: float
    rank: int
    headlines: list[NewsHeadline]
    overview_summary: str | None = None
    sentiment_label: str | None = None
    overview_heading: str | None = None


class Recommendation(BaseModel):
    symbol: str | None = None
    reason: str
    huge_correction: bool = False
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
