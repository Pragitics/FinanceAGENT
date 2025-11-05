FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /workspace

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY packages/shared/python ./packages/shared/python
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -e packages/shared/python

COPY apps/api/pyproject.toml ./apps/api/pyproject.toml
COPY apps/api/app ./apps/api/app

WORKDIR /workspace/apps/api
RUN pip install --no-cache-dir -e .

COPY apps/api/alembic ./alembic
COPY apps/api/alembic.ini ./alembic.ini

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
