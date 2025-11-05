from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Dict, List

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from financeagent_shared import NewsHeadline, RankedSymbol, Recommendation

from app.agents.pipeline import DailyRankingPipeline, PipelineResult
from app.agents.providers.mock import MockPriceProvider
from app.agents.providers.yahoo import YahooPriceProvider
from app.agents.providers.summary import PerplexitySummaryProvider
from app.llm.perplexity import PerplexityClient
from app.config import settings
from app.db import models
from app.services import cache, watchlist as watchlist_service
from app.services.ranking import RecommendationRecord


def _load_watchlist_items(session: Session, user: models.User) -> list[WatchlistItem]:
    items = watchlist_service.list_watchlist_items(session, user)
    if items:
        return items
    if settings.demo_mode:
        return []
    return []


class MockSummaryProvider:
    def generate(self, symbols: List[str], exchanges: Dict[str, str]) -> Dict[str, tuple[str, str, List[NewsHeadline]]]:
        results: Dict[str, tuple[str, str, List[NewsHeadline]]] = {}
        for symbol in symbols:
            heading = f"{symbol} update"
            summary = f"No live summary available for {symbol}."
            results[symbol] = (heading, summary, [])
        return results


def _load_recent_recommendations(session: Session, user: models.User, as_of: date) -> list[RecommendationRecord]:
    window_start = as_of - timedelta(days=29)
    rows = session.execute(
        select(models.Recommendation).where(
            models.Recommendation.user_id == user.id,
            models.Recommendation.date >= window_start,
        )
    ).scalars()
    records: list[RecommendationRecord] = []
    for row in rows:
        records.append(RecommendationRecord(symbol=row.symbol, date=row.date, huge_correction=row.huge_correction))
    return records


def _persist_daily_scores(session: Session, user: models.User, as_of: date, ranked: list[RankedSymbol]) -> None:
    session.execute(
        delete(models.DailyScore).where(
            models.DailyScore.date == as_of,
            models.DailyScore.user_id == user.id,
        )
    )
    for item in ranked:
        score = models.DailyScore(
            user_id=user.id,
            symbol=item.symbol,
            date=as_of,
            price_change_pct=float(item.price_change_pct),
            sentiment_score=float(item.sentiment_score),
            bias_score=float(item.opportunity_score),
            rank=item.rank,
        )
        session.add(score)


def _persist_summary_data(
    session: Session,
    user: models.User,
    headings: dict[str, str],
    summaries: dict[str, str],
    sources: dict[str, list[NewsHeadline]],
) -> None:
    symbols = set(headings.keys()) | set(summaries.keys()) | set(sources.keys())
    for symbol in symbols:
        session.execute(
            delete(models.NewsItem).where(
                models.NewsItem.symbol == symbol,
                models.NewsItem.user_id == user.id,
            )
        )
        heading = headings.get(symbol)
        summary_text = summaries.get(symbol)
        if heading or summary_text:
            session.add(
                models.NewsItem(
                    user_id=user.id,
                    symbol=symbol,
                    source="Perplexity",
                    headline=heading or symbol,
                    url="",
                    published_at=datetime.now(timezone.utc),
                    sentiment_score=None,
                    summary=summary_text,
                    raw_json=None,
                )
            )
        for item in sources.get(symbol, []):
            session.add(
                models.NewsItem(
                    user_id=user.id,
                    symbol=symbol,
                    source=item.source,
                    headline=item.headline,
                    url=item.url,
                    published_at=item.published_at,
                    sentiment_score=item.sentiment_score,
                    summary=item.summary,
                    raw_json=item.raw_json,
                )
            )


def _persist_recommendation(
    session: Session,
    user: models.User,
    as_of: date,
    recommendation: Recommendation | None,
) -> None:
    if recommendation is None:
        return
    existing = session.execute(
        select(models.Recommendation).where(
            models.Recommendation.user_id == user.id,
            models.Recommendation.date == as_of,
        )
    ).scalar_one_or_none()
    if existing:
        existing.symbol = recommendation.symbol
        existing.reason = recommendation.reason
        existing.huge_correction = recommendation.huge_correction
        existing.created_at = datetime.now(timezone.utc)
    else:
        session.add(
            models.Recommendation(
                user_id=user.id,
                date=as_of,
                symbol=recommendation.symbol,
                reason=recommendation.reason,
                huge_correction=recommendation.huge_correction,
                created_at=datetime.now(timezone.utc),
            )
        )


def run_daily_pipeline(session: Session, user: models.User, as_of: date | None = None) -> PipelineResult:
    as_of = as_of or date.today()
    watchlist_items = _load_watchlist_items(session, user)
    symbols = [item.symbol for item in watchlist_items]
    exchange_map = {item.symbol: item.exchange for item in watchlist_items}
    history = _load_recent_recommendations(session, user, as_of)

    llm_client = None
    if settings.perplexity_api_key:
        llm_client = PerplexityClient(
            api_key=settings.perplexity_api_key,
            base_url=settings.perplexity_base_url,
            model=settings.perplexity_model,
        )

    if settings.demo_mode and not llm_client:
        summary_provider = MockSummaryProvider()
        price_provider = MockPriceProvider()
    else:
        price_provider = YahooPriceProvider()
        if llm_client:
            summary_provider = PerplexitySummaryProvider(llm_client)
        else:
            summary_provider = MockSummaryProvider()

    pipeline = DailyRankingPipeline(
        summary_provider=summary_provider,
        price_provider=price_provider,
        weights=settings.rank_weights,
        huge_correction_threshold=settings.huge_correction_pct,
        llm_client=llm_client,
    )

    result = pipeline.run(symbols=symbols, history=history, as_of=as_of, exchanges=exchange_map)
    _persist_daily_scores(session, user, as_of, result.ranked)
    _persist_summary_data(session, user, result.summary_headings, result.summary_texts, result.summary_sources)
    _persist_recommendation(session, user, as_of, result.recommendation)
    session.commit()
    cache.cache_pipeline_result(user.id, as_of, result.ranked, result.recommendation)
    return result
