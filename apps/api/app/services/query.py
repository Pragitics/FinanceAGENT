from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from financeagent_shared import NewsHeadline, RankedSymbol, Recommendation

from app.agents.providers.yahoo import YahooPriceProvider
from app.db import models

def _load_exchange_map(session: Session, user: models.User) -> dict[str, str]:
    rows = session.execute(
        select(models.Watchlist.symbol, models.Watchlist.exchange)
        .where(models.Watchlist.user_id == user.id)
    ).all()
    return {symbol: exchange for symbol, exchange in rows}


def _load_headlines(session: Session, user: models.User, symbol: str, limit: int = 3) -> list[NewsHeadline]:
    rows = session.execute(
        select(models.NewsItem)
        .where(
            models.NewsItem.user_id == user.id,
            models.NewsItem.symbol == symbol,
            models.NewsItem.url != "",
        )
        .order_by(models.NewsItem.published_at.desc())
        .limit(limit)
    ).scalars()
    return [NewsHeadline.model_validate(row) for row in rows]


def _load_summary_entry(session: Session, user: models.User, symbol: str) -> NewsHeadline | None:
    row = session.execute(
        select(models.NewsItem)
        .where(
            models.NewsItem.user_id == user.id,
            models.NewsItem.symbol == symbol,
            models.NewsItem.url == "",
        )
        .order_by(models.NewsItem.published_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if row is None:
        return None
    return NewsHeadline.model_validate(row)


def _label_for_sentiment(value: float) -> str:
    if value <= -0.6:
        return "Strong Negative"
    if value <= -0.2:
        return "Negative"
    if value >= 0.6:
        return "Strong Positive"
    if value >= 0.2:
        return "Positive"
    return "Neutral"


def get_ranked_today(session: Session, user: models.User, as_of: date | None = None) -> list[RankedSymbol]:
    as_of = as_of or date.today()
    scores = session.execute(
        select(models.DailyScore)
        .where(
            models.DailyScore.date == as_of,
            models.DailyScore.user_id == user.id,
        )
        .order_by(models.DailyScore.rank.asc())
    ).scalars()
    symbols: list[str] = []
    score_rows = []
    for row in scores:
        score_rows.append(row)
        symbols.append(row.symbol)

    if not symbols:
        return []

    exchange_map = _load_exchange_map(session, user)
    price_provider = YahooPriceProvider()
    price_info: dict[str, dict[str, float]] = {}
    try:
        price_info = price_provider.fetch(symbols, exchange_map)
    except Exception:
        price_info = {}

    ranked: list[RankedSymbol] = []
    for row in score_rows:
        info = price_info.get(row.symbol, {})
        last_price = info.get("last_price")
        summary_entry = _load_summary_entry(session, user, row.symbol)
        heading = summary_entry.headline if summary_entry else None
        summary_text = summary_entry.summary if summary_entry else None
        ranked.append(
            RankedSymbol(
                symbol=row.symbol,
                opportunity_score=float(row.bias_score),
                price_change_pct=float(row.price_change_pct),
                last_price=float(last_price) if last_price is not None else None,
                sentiment_score=float(row.sentiment_score),
                rank=row.rank,
                headlines=_load_headlines(session, user, row.symbol),
                overview_heading=heading,
                overview_summary=summary_text,
                sentiment_label=_label_for_sentiment(float(row.sentiment_score)),
            )
        )
    return ranked


def get_recommendation_today(session: Session, user: models.User, as_of: date | None = None) -> Recommendation | None:
    as_of = as_of or date.today()
    row = session.execute(
        select(models.Recommendation).where(
            models.Recommendation.user_id == user.id,
            models.Recommendation.date == as_of,
        )
    ).scalar_one_or_none()
    if not row:
        return None
    return Recommendation.model_validate(row)
