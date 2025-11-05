from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, health, rank, recommend, run, watchlist, symbols
from app.db.session import init_db

app = FastAPI(title="FinanceAGENT API", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(watchlist.router)
app.include_router(rank.router)
app.include_router(recommend.router)
app.include_router(run.router)
app.include_router(symbols.router)
app.include_router(auth.router)


@app.get("/config")
async def get_config() -> dict[str, str | float | bool]:
    return {
        "timezone": settings.timezone,
        "huge_correction_pct": settings.huge_correction_pct,
    }


@app.on_event("startup")
def run_initial_pipeline() -> None:
    try:
        init_db()
    except Exception as exc:  # pragma: no cover - startup resilience
        logging.getLogger(__name__).warning("Startup initialization failed: %s", exc)
