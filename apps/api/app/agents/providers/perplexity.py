from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List

from financeagent_shared import NewsHeadline

from app.llm.perplexity import PerplexityClient


class PerplexityNewsProvider:
    def __init__(self, client: PerplexityClient, max_items: int = 3, fallback=None) -> None:
        self.client = client
        self.max_items = max_items
        self.fallback = fallback

    def fetch(self, symbols: List[str], exchanges: Dict[str, str]) -> Dict[str, List[NewsHeadline]]:
        results: Dict[str, List[NewsHeadline]] = {}
        for symbol in symbols:
            exchange = exchanges.get(symbol)
            articles = self.client.fetch_news_articles(symbol, exchange, max_items=self.max_items)
            headlines: List[NewsHeadline] = []
            for article in articles:
                published_at = self._parse_datetime(article.get("published_at"))
                headlines.append(
                    NewsHeadline(
                        id=None,
                        symbol=symbol,
                        source=article.get("source", "Perplexity"),
                        headline=article.get("headline", ""),
                        url=article.get("url", ""),
                        published_at=published_at,
                        summary=article.get("summary"),
                        sentiment_score=None,
                        raw_json=None,
                    )
                )
            if not headlines and self.fallback is not None:
                fallback_results = self.fallback.fetch([symbol], exchanges)
                headlines = fallback_results.get(symbol, [])
            results[symbol] = headlines
        return results

    @staticmethod
    def _parse_datetime(value: str | None) -> datetime:
        if not value:
            return datetime.now(timezone.utc)
        for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d %H:%M:%S%z", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
            try:
                dt = datetime.strptime(value, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc)
            except ValueError:
                continue
        return datetime.now(timezone.utc)
