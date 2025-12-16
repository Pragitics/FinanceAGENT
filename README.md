# FinanceAGENT

Value-investor companion that scans your watchlist, pulls live prices, summarizes reputable news, and scores sentiment to surface “value buy” ideas. The pipeline can use your own Perplexity key for richer summaries and sentiment.

## What’s inside
- **Web (Vite/React)** – Dashboard at `http://localhost:5174` with auth, watchlist, run-analysis button, optional Perplexity key field (stored only in your browser).
- **API (FastAPI)** – Auth, watchlist, ranking pipeline, news/sentiment generation. Serves at `http://localhost:8000`.
- **Postgres** – Primary datastore.
- **Redis (optional)** – Caches latest pipeline results; app runs without it.
- **Temporal (optional)** – For scheduling/backfilling pipelines; not required for manual runs.

## Quick start (minimal stack)
1) **Env files**  
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
   - Leave `PERPLEXITY_API_KEY` empty if you want to supply per-run in the UI.  
   - Leave `KITE_PUBLISHER_API_KEY` empty or set your own (no repo secrets).

2) **Databases & API** (Postgres + API; Redis optional)  
   ```bash
   docker compose up -d postgres redis api
   docker compose run --rm api alembic -c alembic.ini upgrade head   # only once per fresh DB
   ```

3) **Web app** (runs on port 5174)  
   ```bash
   cd apps/web
   npm install
   npm run dev -- --host 0.0.0.0 --port 5174
   ```
   Then open `http://localhost:5174`.

## Optional services
- **Temporal**: `docker compose up -d temporal temporal-ui` if you want scheduled/backfill workflows. If you skip Temporal, manual “Run Analysis” works fine.
- **Redis**: improves cache hit for recent pipeline results. Safe to skip; failures degrade gracefully.

## Using the app
- Register/login from the web UI.  
- Add symbols to your watchlist.  
- (Optional) Paste your Perplexity API key in the Dashboard’s “Perplexity API key” field; it stays in localStorage and is sent only when you click **Run Analysis**.  
- Click **Run Analysis**: the API fetches prices/news, runs sentiment/summary agents, stores results, and returns a ranked opportunity list plus a single recommended pick.

## Kite publisher key
Set `VITE_KITE_PUBLISHER_API_KEY` (web) and `KITE_PUBLISHER_API_KEY` (api) to your own value as needed. The repo ships with blanks; the old demo key has been removed.

## Ports
- API: `8000`
- Web dev: `5174`

## Troubleshooting
- **DB already initialized**: If `alembic upgrade` complains about existing tables, the schema is already present; skip the command or drop tables before re-running.  
- **Temporal fails to start**: It’s optional; you can ignore unless you need scheduled runs.  
- **CORS**: `http://localhost:5174` is allowed by default; add more origins via `CORS_ORIGINS` in `apps/api/.env`.
