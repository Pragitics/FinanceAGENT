from fastapi import APIRouter, Query

from app.services import symbols as symbol_service

router = APIRouter(prefix="/symbols", tags=["symbols"])


@router.get("")
def search_symbols(q: str = Query("", min_length=1)) -> list[dict[str, str | None]]:
    suggestions = symbol_service.search_symbols(q, limit=10)
    response: list[dict[str, str | None]] = []
    for suggestion in suggestions:
        response.append({
            "symbol": suggestion.symbol,
            "full_symbol": suggestion.full_symbol,
            "name": suggestion.name,
            "exchange": suggestion.exchange,
            "quote_type": suggestion.quote_type,
        })
    return response
