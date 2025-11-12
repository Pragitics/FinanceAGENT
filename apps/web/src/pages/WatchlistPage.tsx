import { useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { AddSymbolForm } from "@/components/watchlist/AddSymbolForm";
import { WatchlistList } from "@/components/watchlist/WatchlistList";
import { useAuth } from "@/context/AuthContext";
import { useViewModelState } from "@/hooks/useViewModel";
import { ApiClient } from "@/services/ApiClient";
import { FinanceService } from "@/services/FinanceService";
import { WatchlistViewModel } from "@/viewmodels/WatchlistViewModel";

export function WatchlistPage() {
  const { token } = useAuth();
  const apiClient = useMemo(() => new ApiClient(() => token), [token]);
  const financeService = useMemo(() => new FinanceService(apiClient), [apiClient]);
  const viewModel = useMemo(() => new WatchlistViewModel(financeService), [financeService]);
  const state = useViewModelState(viewModel);

  useEffect(() => {
    void viewModel.initialize();
  }, [viewModel]);

  const handleSubmit = useCallback(
    async (symbol: string) => {
      const added = await viewModel.addSymbol(symbol);
      if (added) {
        await viewModel.initialize();
      }
      return added;
    },
    [viewModel],
  );

  const handleSearch = useCallback(
    async (query: string, signal: AbortSignal) => {
      await viewModel.searchSymbols(query, signal);
    },
    [viewModel],
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Watchlist</h1>
          <p className="text-sm text-slate-400">Curate 5–10 symbols to feed the opportunity score engine.</p>
        </div>
        <Link
          to="/"
          className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Back to dashboard
        </Link>
      </header>
      {state.error && <p className="mt-4 text-sm text-red-400">{state.error}</p>}
      <section className="mt-8 grid gap-6">
        <Card title="Add symbol">
          <AddSymbolForm
            pending={state.submitting}
            message={state.message}
            suggestions={state.suggestions}
            onSubmit={handleSubmit}
            onSearch={handleSearch}
          />
        </Card>
        <Card title="Current symbols">
          {state.loading ? (
            <p className="text-sm text-slate-400">Loading watchlist…</p>
          ) : (
            <WatchlistList items={state.items} onRemove={(symbol) => viewModel.removeSymbol(symbol)} />
          )}
        </Card>
      </section>
    </main>
  );
}
