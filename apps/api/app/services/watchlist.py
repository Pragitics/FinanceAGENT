from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from financeagent_shared import WatchlistCreate, WatchlistItem

from app.db import models
from app.services import symbols as symbol_service


def list_watchlist(session: Session, user: models.User) -> list[WatchlistItem]:
    rows = session.execute(
        select(models.Watchlist)
        .where(models.Watchlist.user_id == user.id)
        .order_by(models.Watchlist.symbol)
    ).scalars()
    return [WatchlistItem.model_validate(row) for row in rows]


def add_to_watchlist(session: Session, user: models.User, payload: WatchlistCreate) -> WatchlistItem:
    lookup = symbol_service.resolve_symbol(payload.symbol)
    symbol = lookup.symbol.upper()
    exchange = (lookup.exchange or payload.exchange or "").upper()
    if not exchange:
        raise ValueError("Unable to determine exchange for symbol")
    entry = models.Watchlist(user_id=user.id, symbol=symbol, exchange=exchange)
    session.add(entry)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise ValueError("Symbol already in watchlist") from exc
    session.refresh(entry)
    return WatchlistItem.model_validate(entry)


def remove_from_watchlist(session: Session, user: models.User, symbol: str) -> None:
    row = session.execute(
        select(models.Watchlist).where(
            models.Watchlist.user_id == user.id,
            models.Watchlist.symbol == symbol.upper(),
        )
    ).scalar_one_or_none()
    if not row:
        return
    session.delete(row)
    session.commit()


def list_watchlist_items(session: Session, user: models.User) -> list[WatchlistItem]:
    return list_watchlist(session, user)
