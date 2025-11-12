from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    watchlist: Mapped[list["Watchlist"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    daily_scores: Mapped[list["DailyScore"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    news_items: Mapped[list["NewsItem"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    recommendations: Mapped[list["Recommendation"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Watchlist(Base):
    __tablename__ = "watchlist"
    __table_args__ = (
        Index("ix_watchlist_user_id_symbol", "user_id", "symbol", unique=True),
        {"sqlite_autoincrement": True},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    symbol: Mapped[str] = mapped_column(String(16), nullable=False)
    exchange: Mapped[str] = mapped_column(String(16), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="watchlist")


class NewsItem(Base):
    __tablename__ = "news_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    symbol: Mapped[str] = mapped_column(String(16), index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    headline: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sentiment_score: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user: Mapped[User] = relationship(back_populates="news_items")


class DailyScore(Base):
    __tablename__ = "daily_scores"
    __table_args__ = (
        Index("ix_daily_scores_symbol_date_user", "symbol", "date", "user_id", unique=True),
        {"sqlite_autoincrement": True},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    symbol: Mapped[str] = mapped_column(String(16), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    price_change_pct: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    sentiment_score: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    bias_score: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped[User] = relationship(back_populates="daily_scores")


class Recommendation(Base):
    __tablename__ = "recommendations"
    __table_args__ = ( {"sqlite_autoincrement": True}, )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    symbol: Mapped[str] = mapped_column(String(16), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    huge_correction: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="recommendations")
