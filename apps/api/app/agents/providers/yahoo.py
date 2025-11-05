from __future__ import annotations

from datetime import datetime, timezone
import httpx
from html import unescape
from xml.etree import ElementTree

from financeagent_shared import NewsHeadline

USER_AGENT = "Mozilla/5.0 (compatible; FinanceAgent/0.1; +https://github.com/FinanceAgent)"


def _format_symbol(symbol: str, exchange: str | None) -> str:
    if exchange:
        normalized = exchange.upper()
        if normalized == "NSE" and not symbol.endswith(".NS"):
            return f"{symbol}.NS"
        if normalized == "BSE" and not symbol.endswith(".BO"):
            return f"{symbol}.BO"
    return symbol


class YahooPriceProvider:
    def __init__(self, client: httpx.Client | None = None) -> None:
        self._client = client

    def fetch(self, symbols: list[str], exchanges: dict[str, str]) -> dict[str, dict[str, float]]:
        created_client = False
        if self._client is None:
            self._client = httpx.Client(timeout=10, headers={"User-Agent": USER_AGENT})
            created_client = True

        changes: dict[str, dict[str, float]] = {}
        try:
            for symbol in symbols:
                yf_symbol = _format_symbol(symbol, exchanges.get(symbol))
                endpoint = f"https://query1.finance.yahoo.com/v8/finance/chart/{yf_symbol}"
                params = {"interval": "1d", "range": "5d"}
                response = self._client.get(endpoint, params=params)
                if response.status_code != 200:
                    continue
                data = response.json()
                try:
                    result = data["chart"]["result"][0]
                    closes: list[float] = result["indicators"]["quote"][0]["close"]
                    meta = result.get("meta", {})
                    last_price = meta.get("regularMarketPrice")
                except (KeyError, TypeError, IndexError):
                    continue
                closes = [close for close in closes if close is not None]
                if len(closes) < 2:
                    continue
                latest, previous = closes[-1], closes[-2]
                if previous == 0:
                    continue
                pct_change = ((latest - previous) / previous) * 100
                info: dict[str, float] = {"change_pct": round(pct_change, 2)}
                if last_price is not None:
                    info["last_price"] = float(last_price)
                changes[symbol] = info
        finally:
            if created_client and self._client is not None:
                self._client.close()
                self._client = None
        return changes


class YahooNewsProvider:
    def __init__(self, client: httpx.Client | None = None, max_items: int = 3) -> None:
        self._client = client
        self.max_items = max_items

    def fetch(self, symbols: list[str], exchanges: dict[str, str]) -> dict[str, list[NewsHeadline]]:
        created_client = False
        if self._client is None:
            self._client = httpx.Client(timeout=10, headers={"User-Agent": USER_AGENT})
            created_client = True

        results: dict[str, list[NewsHeadline]] = {}
        try:
            for symbol in symbols:
                yf_symbol = _format_symbol(symbol, exchanges.get(symbol))
                url = "https://finance.yahoo.com/rss/2.0/headline"
                query = {"s": yf_symbol, "lang": "en-IN", "region": "IN"}
                response = self._client.get(url, params=query, follow_redirects=True)
                if response.status_code != 200:
                    results[symbol] = []
                    continue
                try:
                    feed = ElementTree.fromstring(response.text)
                except ElementTree.ParseError:
                    results[symbol] = []
                    continue

                items: list[NewsHeadline] = []
                for item in feed.findall(".//item")[: self.max_items]:
                    headline = self._text_or_none(item.find("title")) or f"{symbol} update"
                    link = self._text_or_none(item.find("link")) or ""
                    pub_date = self._parse_pub_date(self._text_or_none(item.find("pubDate")))
                    summary = self._clean_description(self._text_or_none(item.find("description")))
                    items.append(
                        NewsHeadline(
                            id=None,
                            symbol=symbol,
                            source="Yahoo Finance",
                            headline=headline,
                            url=link,
                            published_at=pub_date,
                            sentiment_score=None,
                            summary=summary,
                            raw_json=None,
                        )
                    )
                results[symbol] = items
        finally:
            if created_client and self._client is not None:
                self._client.close()
                self._client = None
        return results

    @staticmethod
    def _text_or_none(element: ElementTree.Element | None) -> str | None:
        if element is None or element.text is None:
            return None
        return element.text.strip()

    @staticmethod
    def _clean_description(description: str | None) -> str | None:
        if not description:
            return None
        text = unescape(description)
        # Remove rudimentary HTML tags
        return " ".join(text.replace("<![CDATA[", "").replace("]]>", "").split())

    @staticmethod
    def _parse_pub_date(value: str | None) -> datetime:
        if not value:
            return datetime.now(timezone.utc)
        try:
            return datetime.strptime(value, "%a, %d %b %Y %H:%M:%S %z")
        except ValueError:
            return datetime.now(timezone.utc)
