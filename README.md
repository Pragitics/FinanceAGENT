# FinanceAGENT

Monorepo for a value-investing assistant MVP. See `Makefile` and per-app docs for usage.

## Quick notes

- FastAPI now requires JWT auth. Configure `AUTH_SECRET` and `TOKEN_EXPIRES_MINUTES` in `apps/api/.env` and create users via `/auth/register` or the web UI registration page.
- The Next.js dashboard pulls data via authenticated server actions and only runs the opportunity analysis when you press **Run Analysis**.
