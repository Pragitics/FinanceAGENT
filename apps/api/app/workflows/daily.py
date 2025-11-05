from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import select
from temporalio import activity, workflow

from app.db import models
from app.db.session import SessionLocal
from app.services import pipeline_runner


@activity.defn
def run_daily_activity(as_of: date | None = None) -> dict[str, int]:
    target_date = as_of or date.today()
    with SessionLocal() as session:
        users = session.execute(select(models.User)).scalars().all()
        total_ranked = 0
        for user in users:
            result = pipeline_runner.run_daily_pipeline(session, user, target_date)
            total_ranked += len(result.ranked)
        return {"ranked": total_ranked}


@workflow.defn(name="daily_pipeline_workflow")
class DailyPipelineWorkflow:
    @workflow.run
    async def run(self) -> dict[str, int]:
        today = datetime.utcnow().date()
        return await workflow.execute_activity(
            run_daily_activity,
            today,
            schedule_to_close_timeout=timedelta(minutes=5),
        )


@workflow.defn(name="backfill_workflow")
class BackfillWorkflow:
    @workflow.run
    async def run(self, start_date: date, end_date: date) -> list[dict[str, int]]:
        current = start_date
        results: list[dict[str, int]] = []
        while current <= end_date:
            result = await workflow.execute_activity(
                run_daily_activity,
                current,
                schedule_to_close_timeout=timedelta(minutes=5),
            )
            results.append(result)
            current += timedelta(days=1)
        return results
