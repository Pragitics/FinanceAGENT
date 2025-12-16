import { useEffect, useMemo, useState } from "react";

import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { MarketSummary } from "@/components/dashboard/MarketSummary";
import { RankedList } from "@/components/dashboard/RankedList";
import { RunAnalysisPanel } from "@/components/dashboard/RunAnalysisPanel";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useViewModelState } from "@/hooks/useViewModel";
import { ApiClient } from "@/services/ApiClient";
import { FinanceService } from "@/services/FinanceService";
import { DashboardViewModel } from "@/viewmodels/DashboardViewModel";
import { getStoredPerplexityKey, storePerplexityKey } from "@/core/perplexityKeyStorage";

export function DashboardPage() {
  const { token } = useAuth();
  const apiClient = useMemo(() => new ApiClient(() => token), [token]);
  const financeService = useMemo(() => new FinanceService(apiClient), [apiClient]);
  const viewModel = useMemo(() => new DashboardViewModel(financeService), [financeService]);
  const state = useViewModelState(viewModel);
  const [perplexityKey, setPerplexityKey] = useState<string>(() => getStoredPerplexityKey() ?? "");

  const handlePerplexityKeyChange = (value: string) => {
    setPerplexityKey(value);
    storePerplexityKey(value || null);
  };

  const handleRun = () => viewModel.runAnalysis(perplexityKey || null);

  useEffect(() => {
    void viewModel.initialize();
  }, [viewModel]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Discover Today&apos;s Opportunity</h1>
          <p className="text-sm text-slate-400">
            Launch the analysis to refresh opportunity scores, verified news briefs, and live prices whenever you need clarity.
          </p>
        </div>
        <RunAnalysisPanel
          lastUpdated={state.lastUpdated}
          running={state.running}
          onRun={handleRun}
          perplexityKey={perplexityKey}
          onPerplexityKeyChange={handlePerplexityKeyChange}
          error={state.error}
        />
      </header>
      {(!state.initialized || state.loading) && (
        <Card>
          <p className="text-sm text-slate-400">Loading dashboard data…</p>
        </Card>
      )}
      {state.initialized && !state.loading && (
        <>
          <section className="grid gap-6 md:grid-cols-2">
            <RecommendationCard recommendation={state.recommendation} />
            <MarketSummary rankings={state.rankings} />
          </section>
          <RankedList rankings={state.rankings} />
        </>
      )}
    </main>
  );
}
