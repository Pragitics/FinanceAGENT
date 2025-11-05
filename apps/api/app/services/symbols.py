from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

import httpx

SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search"


@dataclass(frozen=True)
class SymbolSuggestion:
    symbol: str
    full_symbol: str
    name: str | None = None
    exchange: str | None = None
    quote_type: str | None = None


def _http_get(url: str, params: dict[str, Any]) -> dict[str, Any] | None:
    try:
        with httpx.Client(timeout=8.0, headers={"User-Agent": "FinanceAgent/0.1"}) as client:
            response = client.get(url, params=params)
        if response.status_code != 200:
            return None
        return response.json()
    except (httpx.HTTPError, ValueError):
        return None


def _normalise_exchange(symbol: str, exchange: str | None) -> str | None:
    if not exchange:
        exchange = ""
    upper = exchange.upper()
    if "." in symbol:
        suffix = symbol.split(".")[-1]
        if suffix == "NS":
            return "NSE"
        if suffix == "BO":
            return "BSE"
    if upper in {"NSE", "NSEI"}:
        return "NSE"
    if upper in {"BSE", "BSE LTD"}:
        return "BSE"
    if upper:
        return upper
    return None


def search_symbols(query: str, limit: int = 10) -> list[SymbolSuggestion]:
    params = {
        "q": query,
        "lang": "en-IN",
        "region": "IN",
        "quotesCount": limit,
    }
    payload = _http_get(SEARCH_URL, params)
    if not payload:
        return []
    quotes: Iterable[dict[str, Any]] = payload.get("quotes") or []
    suggestions: list[SymbolSuggestion] = []
    for quote in quotes:
        raw_symbol = quote.get("symbol")
        if not raw_symbol:
            continue
        quote_type_raw = quote.get("quoteType")
        quote_type = (quote_type_raw or "").lower()
        if quote_type not in {"equity", "etf", "mutualfund", "index"}:
            # Ignore currencies, crypto, futures, etc.
            continue
        name = quote.get("shortname") or quote.get("longname")
        exchange = _normalise_exchange(str(raw_symbol), quote.get("exchange") or quote.get("exch"))
        base_symbol = str(raw_symbol).split(".")[0].upper()
        suggestions.append(
            SymbolSuggestion(
                symbol=base_symbol,
                full_symbol=str(raw_symbol),
                name=name.strip() if isinstance(name, str) else None,
                exchange=exchange,
                quote_type=quote_type_raw,
            )
        )
        if len(suggestions) >= limit:
            break
    return suggestions


def resolve_symbol(symbol: str) -> SymbolSuggestion:
    symbol = symbol.strip()
    if not symbol:
        raise ValueError("Symbol is required")
    # Try exact match first
    suggestions = search_symbols(symbol, limit=6)
    upper = symbol.upper()
    # Accept exact symbol matches (with or without suffix)
    for suggestion in suggestions:
        full_upper = suggestion.full_symbol.upper()
        if full_upper == upper or suggestion.symbol.upper() == upper:
            exchange = suggestion.exchange or _normalise_exchange(suggestion.full_symbol, None)
            return SymbolSuggestion(
                symbol=suggestion.symbol.upper(),
                full_symbol=suggestion.full_symbol,
                name=suggestion.name,
                exchange=exchange,
                quote_type=suggestion.quote_type,
            )
    if suggestions:
        # Fallback to first suggestion
        primary = suggestions[0]
        exchange = primary.exchange or _normalise_exchange(primary.full_symbol, None)
        return SymbolSuggestion(
            symbol=primary.symbol.upper(),
            full_symbol=primary.full_symbol,
            name=primary.name,
            exchange=exchange,
            quote_type=primary.quote_type,
        )
    raise ValueError("Unable to find a matching symbol")
