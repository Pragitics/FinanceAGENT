from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from financeagent_shared import Recommendation

from app.dependencies import get_current_user, get_db
from app.db import models
from app.services import query

router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.get("/today", response_model=Recommendation)
def get_today_recommendation(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> Recommendation:
    today = date.today()
    recommendation = query.get_recommendation_today(db, current_user, today)
    if recommendation:
        return recommendation
    return Recommendation(symbol=None, reason="Run analysis to generate a pick", huge_correction=False)
