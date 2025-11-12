from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Dict, List

from financeagent_shared import NewsHeadline

from app.llm.perplexity import PerplexityClient


class SummaryProvider:
    def generate(self, symbols: List[str], exchanges: Dict[str, str]) -> Dict[str, tuple[str, str, List[NewsHeadline]]]:
        raise NotImplementedError


class PerplexitySummaryProvider(SummaryProvider):
    def __init__(self, client: PerplexityClient, max_workers: int = 4) -> None:
        self.client = client
        self.max_workers = max_workers

    def generate(self, symbols: List[str], exchanges: Dict[str, str]) -> Dict[str, tuple[str, str, List[NewsHeadline]]]:
        summaries: Dict[str, tuple[str, str, List[NewsHeadline]]] = {}
        if not symbols:
            return summaries

        workers = max(1, min(self.max_workers, len(symbols)))

        def build_payload(symbol: str) -> tuple[str, dict | None]:
            exchange = exchanges.get(symbol)
            return symbol, self.client.generate_stock_summary(symbol, exchange)

        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(build_payload, symbol) for symbol in symbols]
            for future in as_completed(futures):
                try:
                    symbol, result = future.result()
                except Exception:
                    continue
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
