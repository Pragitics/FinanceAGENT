from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from financeagent_shared import RankedSymbol

from app.dependencies import get_current_user, get_db
from app.db import models
from app.services import query

router = APIRouter(prefix="/rank", tags=["rank"])


@router.get("/today", response_model=list[RankedSymbol])
def get_today_rankings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> list[RankedSymbol]:
    today = date.today()
    return query.get_ranked_today(db, current_user, today)
