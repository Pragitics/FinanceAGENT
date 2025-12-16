import type { RankResponse, Recommendation } from "@financeagent/shared";

import { BaseViewModel } from "./BaseViewModel";
import { FinanceService } from "@/services/FinanceService";

type DashboardState = {
  loading: boolean;
  error: string | null;
  rankings: RankResponse;
  recommendation: Recommendation | null;
  running: boolean;
  lastUpdated: string | null;
  initialized: boolean;
};

export class DashboardViewModel extends BaseViewModel<DashboardState> {
  constructor(private readonly financeService: FinanceService) {
    super({
      loading: false,
      error: null,
      rankings: [],
      recommendation: null,
      running: false,
      lastUpdated: null,
      initialized: false,
    });
  }

  async initialize(force = false): Promise<void> {
    if (this.state.loading || (this.state.initialized && !force)) {
      return;
    }
    this.setState({ loading: true, error: null });
    try {
      const [recommendation, rankings] = await Promise.all([
        this.financeService.getTodayRecommendation(),
        this.financeService.getTodayRankings(),
      ]);
      this.setState({
        recommendation,
        rankings,
        lastUpdated: recommendation.created_at ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load dashboard.";
      this.setState({ error: message });
    } finally {
      this.setState({ loading: false, initialized: true });
    }
  }

  async refresh(): Promise<void> {
    this.setState({ initialized: false });
    await this.initialize(true);
  }

  async runAnalysis(perplexityKey?: string | null): Promise<void> {
    if (this.state.running) {
      return;
    }
    this.setState({ running: true, error: null });
    try {
      const result = await this.financeService.runDailyPipeline(perplexityKey);
      await this.refresh();
      this.setState({ lastUpdated: result.last_updated ?? new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Run failed.";
      this.setState({ error: message });
    } finally {
      this.setState({ running: false });
    }
  }
}
