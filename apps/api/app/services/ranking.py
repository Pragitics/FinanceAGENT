from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from financeagent_shared import RankedSymbol, Recommendation


@dataclass(frozen=True)
class RecommendationRecord:
    symbol: str
    date: date
    huge_correction: bool


def compute_opportunity_score(price_change_pct: float, sentiment_score: float, weights: tuple[float, float]) -> float:
    drop_component = -price_change_pct
    neg_sentiment = max(0.0, -sentiment_score)
    return weights[0] * drop_component + weights[1] * neg_sentiment


def should_skip_symbol(
    symbol: str,
    history: list[RecommendationRecord],
    as_of: date,
    price_change_pct: float,
    huge_correction_threshold: float,
) -> bool:
    for record in history:
        if record.symbol != symbol:
            continue
        days_since = (as_of - record.date).days
        if days_since < 30 and price_change_pct > -huge_correction_threshold:
            return True
    return False


def select_recommendation(
    ranked: list[RankedSymbol],
    history: list[RecommendationRecord],
    as_of: date,
    huge_correction_threshold: float,
) -> Recommendation | None:
    for item in ranked:
        if should_skip_symbol(item.symbol, history, as_of, item.price_change_pct, huge_correction_threshold):
            continue
        huge_correction = item.price_change_pct <= -huge_correction_threshold
        reason = (
            f"Opportunity score {item.opportunity_score:.2f} with price change {item.price_change_pct:.2f}%"
        )
        return Recommendation(symbol=item.symbol, reason=reason, huge_correction=huge_correction)
    return None
