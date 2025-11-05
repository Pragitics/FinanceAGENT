from datetime import date, datetime, timedelta, timezone

from financeagent_shared import NewsHeadline, RankedSymbol

from app.services.ranking import RecommendationRecord, compute_opportunity_score, select_recommendation, should_skip_symbol


def _ranked(symbol: str, bias: float, price: float, sentiment: float) -> RankedSymbol:
    return RankedSymbol(
        symbol=symbol,
        opportunity_score=bias,
        price_change_pct=price,
        last_price=None,
        sentiment_score=sentiment,
        rank=1,
        headlines=[
            NewsHeadline(
                id=None,
                symbol=symbol,
                source="Test",
                headline=f"{symbol} news",
                url="https://example.com",
                published_at=datetime.now(timezone.utc),
                sentiment_score=sentiment,
            )
        ],
    )


def test_compute_opportunity_score() -> None:
    bias = compute_opportunity_score(-5.0, -0.5, (0.6, 0.4))
    assert round(bias, 2) == 3.2


def test_should_skip_symbol_within_window() -> None:
    history = [
        RecommendationRecord(symbol="AAPL", date=date.today() - timedelta(days=10), huge_correction=False)
    ]
    assert should_skip_symbol("AAPL", history, date.today(), -2.0, 8.0) is True


def test_should_not_skip_on_huge_correction() -> None:
    history = [
        RecommendationRecord(symbol="AAPL", date=date.today() - timedelta(days=10), huge_correction=False)
    ]
    assert should_skip_symbol("AAPL", history, date.today(), -10.0, 8.0) is False


def test_select_recommendation_skips_recent_symbol() -> None:
    today = date.today()
    history = [RecommendationRecord(symbol="AAPL", date=today - timedelta(days=5), huge_correction=False)]
    ranked = [
        _ranked("AAPL", 4.0, -4.0, -0.3),
        _ranked("MSFT", 3.0, -3.0, -0.2),
    ]
    rec = select_recommendation(ranked, history, today, 8.0)
    assert rec is not None
    assert rec.symbol == "MSFT"


def test_select_recommendation_returns_huge_correction_flag() -> None:
    today = date.today()
    history = [RecommendationRecord(symbol="INFY", date=today - timedelta(days=2), huge_correction=False)]
    ranked = [
        _ranked("INFY", 5.0, -9.0, -0.4),
    ]
    rec = select_recommendation(ranked, history, today, 8.0)
    assert rec is not None
    assert rec.symbol == "INFY"
    assert rec.huge_correction is True
