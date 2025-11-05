from __future__ import annotations

from datetime import datetime, timezone
from typing import Protocol

from financeagent_shared import NewsHeadline


class NewsProvider(Protocol):
    def fetch(self, symbols: list[str], exchanges: dict[str, str]) -> dict[str, list[NewsHeadline]]:
        ...


class PriceProvider(Protocol):
    def fetch(self, symbols: list[str], exchanges: dict[str, str]) -> dict[str, dict[str, float]]:
        ...


class MockNewsProvider:
    def fetch(self, symbols: list[str], exchanges: dict[str, str]) -> dict[str, list[NewsHeadline]]:
        now = datetime.now(timezone.utc)
        news: dict[str, list[NewsHeadline]] = {}
        for idx, symbol in enumerate(symbols):
            news[symbol] = [
                NewsHeadline(
                    id=None,
                    symbol=symbol,
                    source="MockWire",
                    headline=f"{symbol} headline {idx + 1}",
                    url=f"https://news.example.com/{symbol.lower()}-{idx + 1}",
                    published_at=now,
                    sentiment_score=(-0.2 if idx % 2 == 0 else 0.1),
                    summary=f"Summary for {symbol} headline {idx + 1}.",
                )
            ]
        return news


class MockPriceProvider:
    def fetch(self, symbols: list[str], exchanges: dict[str, str]) -> dict[str, dict[str, float]]:
        prices: dict[str, dict[str, float]] = {}
        for idx, symbol in enumerate(symbols, start=1):
            prices[symbol] = {
                "change_pct": -float(idx),
                "last_price": 100.0 * idx,
            }
        return prices
