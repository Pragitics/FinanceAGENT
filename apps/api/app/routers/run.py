from datetime import date

from fastapi import APIRouter, Body, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.db import models
from app.services import pipeline_runner, query

router = APIRouter(prefix="/run", tags=["pipeline"])


class RunDailyRequest(BaseModel):
    perplexity_api_key: str | None = None


@router.post("/daily")
def trigger_daily(
    as_of: date | None = None,
    body: RunDailyRequest | None = Body(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> dict[str, object]:
    target_date = as_of or date.today()
    result = pipeline_runner.run_daily_pipeline(
        db,
        current_user,
        target_date,
        perplexity_api_key=body.perplexity_api_key if body else None,
    )
    recommendation = query.get_recommendation_today(db, current_user, target_date)
    last_updated = recommendation.created_at.isoformat() if recommendation and recommendation.created_at else None
    return {"ranked": len(result.ranked), "last_updated": last_updated}
