import pytest

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
except ModuleNotFoundError:  # pragma: no cover - optional dependency in some envs
    pytest.skip("sqlalchemy not available", allow_module_level=True)

from financeagent_shared import WatchlistCreate

from app.db import models
from app.db.base import Base
from app.services import symbols as symbol_service
from app.services import watchlist as watchlist_service


def _make_session():
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def test_add_watchlist_uses_symbol_lookup(monkeypatch):
    Session = _make_session()

    def fake_resolve(value: str):
        return symbol_service.SymbolSuggestion(
            symbol="INFY",
            full_symbol="INFY.NS",
            name="Infosys Ltd",
            exchange="NSE",
            quote_type="EQUITY",
        )

    monkeypatch.setattr(symbol_service, "resolve_symbol", fake_resolve)

    with Session() as session:
        user = models.User(username="testuser", password_hash="hash")
        session.add(user)
        session.commit()
        session.refresh(user)

        item = watchlist_service.add_to_watchlist(session, user, WatchlistCreate(symbol="infy"))
        assert item.symbol == "INFY"
        assert item.exchange == "NSE"

        items = watchlist_service.list_watchlist(session, user)
        assert [entry.symbol for entry in items] == ["INFY"]


def test_add_watchlist_duplicate(monkeypatch):
    Session = _make_session()

    def fake_resolve(value: str):
        return symbol_service.SymbolSuggestion(
            symbol=value.upper(),
            full_symbol=f"{value.upper()}.NS",
            name="Name",
            exchange="NSE",
            quote_type="EQUITY",
        )

    monkeypatch.setattr(symbol_service, "resolve_symbol", fake_resolve)

    with Session() as session:
        user = models.User(username="dupuser", password_hash="hash")
        session.add(user)
        session.commit()
        session.refresh(user)

        watchlist_service.add_to_watchlist(session, user, WatchlistCreate(symbol="tcs"))
        try:
            watchlist_service.add_to_watchlist(session, user, WatchlistCreate(symbol="TCS"))
        except ValueError as exc:
            assert "already" in str(exc).lower()
        else:
            raise AssertionError("Expected duplicate addition to raise ValueError")
