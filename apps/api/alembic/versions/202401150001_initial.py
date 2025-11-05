"""Initial schema"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202401150001"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
    )

    op.create_table(
        "watchlist",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("symbol", sa.String(length=16), nullable=False),
        sa.Column("exchange", sa.String(length=16), nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "news_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("symbol", sa.String(length=16), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("headline", sa.Text(), nullable=False),
        sa.Column("url", sa.String(length=512), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sentiment_score", sa.Float(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("raw_json", sa.JSON(), nullable=True),
    )

    op.create_table(
        "daily_scores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("symbol", sa.String(length=16), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("price_change_pct", sa.Numeric(10, 4), nullable=False),
        sa.Column("sentiment_score", sa.Numeric(10, 4), nullable=False),
        sa.Column("bias_score", sa.Numeric(10, 4), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
    )

    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("symbol", sa.String(length=16), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("huge_correction", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_index("ix_news_items_symbol", "news_items", ["symbol"])
    op.create_index("ix_watchlist_user_id_symbol", "watchlist", ["user_id", "symbol"], unique=True)
    op.create_index("ix_daily_scores_symbol_date_user", "daily_scores", ["symbol", "date", "user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_news_items_symbol", table_name="news_items")
    op.drop_index("ix_daily_scores_symbol_date_user", table_name="daily_scores")
    op.drop_index("ix_watchlist_user_id_symbol", table_name="watchlist")
    op.drop_table("recommendations")
    op.drop_table("daily_scores")
    op.drop_table("news_items")
    op.drop_table("watchlist")
    op.drop_table("users")
