from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List

from financeagent_shared import NewsHeadline

from app.llm.perplexity import PerplexityClient


class SummaryProvider:
    def generate(self, symbols: List[str], exchanges: Dict[str, str]) -> Dict[str, tuple[str, str, List[NewsHeadline]]]:
        raise NotImplementedError


class PerplexitySummaryProvider(SummaryProvider):
    def __init__(self, client: PerplexityClient) -> None:
        self.client = client

    def generate(self, symbols: List[str], exchanges: Dict[str, str]) -> Dict[str, tuple[str, str, List[NewsHeadline]]]:
        summaries: Dict[str, tuple[str, str, List[NewsHeadline]]] = {}
        for symbol in symbols:
            exchange = exchanges.get(symbol)
            result = self.client.generate_stock_summary(symbol, exchange)
            if not result:
                continue
            sources: List[NewsHeadline] = []
            for source in result.get("sources", []):
                sources.append(
                    NewsHeadline(
                        id=None,
                        symbol=symbol,
                        source=source.get("source", "Perplexity"),
                        headline=source.get("title", ""),
                        url=source.get("url", ""),
                        published_at=datetime.now(timezone.utc),
                        summary=None,
                    )
                )
            summaries[symbol] = (result.get("heading", ""), result.get("summary", ""), sources)
        return summaries
