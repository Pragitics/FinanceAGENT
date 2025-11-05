from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from financeagent_shared import WatchlistCreate, WatchlistItem

from app.dependencies import get_db, get_current_user
from app.services import watchlist as watchlist_service

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("", response_model=list[WatchlistItem])
def get_watchlist(db: Session = Depends(get_db), current_user=Depends(get_current_user)) -> list[WatchlistItem]:
    return watchlist_service.list_watchlist(db, current_user)


@router.post("", response_model=WatchlistItem, status_code=201)
def add_watchlist_item(
    payload: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> WatchlistItem:
    try:
        return watchlist_service.add_to_watchlist(db, current_user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{symbol}", status_code=204)
def delete_watchlist_item(
    symbol: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> None:
    watchlist_service.remove_from_watchlist(db, current_user, symbol)
    return None
