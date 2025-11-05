import { Card } from "@/components/ui/card";
import { KiteBuyButton } from "@/components/KiteBuyButton";
import { ScorePill } from "@/components/ScorePill";
import { BiasBar } from "@/components/BiasBar";
import type { RankResponse } from "@financeagent/shared";
import { getTodayRankings, getTodayRecommendation } from "@/lib/api";
import { RunPipelineButton } from "@/components/RunPipelineButton";
import { requireAuth } from "@/lib/auth";

export default async function DashboardPage() {
  await requireAuth();
  const [recommendation, rankings] = await Promise.all([
    getTodayRecommendation(),
    getTodayRankings(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Discover Today&apos;s Opportunity</h1>
          <p className="text-sm text-slate-400">
            Launch the analysis to refresh opportunity scores, verified news briefs, and live prices whenever you need clarity.
          </p>
        </div>
        <RunPipelineButton initialLastUpdated={recommendation.created_at ?? null} />
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        <RecommendationCard recommendation={recommendation} />
        <MarketSummary rankings={rankings} />
      </section>
      <RankedList rankings={rankings} />
    </main>
  );
}

type RecommendationCardProps = {
  recommendation: Awaited<ReturnType<typeof getTodayRecommendation>>;
};

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const hasPick = Boolean(recommendation.symbol);
  return (
    <Card title="Today's Opportunity" subtitle="Avoid repeats unless a major correction occurs.">
      {hasPick ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-2xl font-semibold text-white">{recommendation.symbol}</p>
            <p className="text-sm text-slate-300">{recommendation.reason}</p>
          </div>
          <KiteBuyButton symbol={recommendation.symbol!} />
          {recommendation.huge_correction && (
            <span className="text-xs font-semibold uppercase text-positive">Huge correction override</span>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-300">{recommendation.reason ?? "No significant dip today."}</p>
      )}
    </Card>
  );
}

type MarketSummaryProps = {
  rankings: RankResponse;
};

function MarketSummary({ rankings }: MarketSummaryProps) {
  if (!rankings.length) {
    return <Card title="Market Snapshot">No rankings yet.</Card>;
  }
  const top = rankings[0];
  return (
    <Card title="Market Snapshot" subtitle="Highest opportunity score right now.">
      <div className="flex flex-wrap items-center gap-4">
        <ScorePill label="Symbol" value={top.symbol} />
        <ScorePill label="Opportunity" value={top.opportunity_score.toFixed(2)} variant="positive" />
        <ScorePill
          label="Daily Move"
          value={`${top.price_change_pct.toFixed(2)}%`}
          variant={top.price_change_pct < 0 ? "negative" : "positive"}
        />
        <ScorePill
          label="Price"
          value={top.last_price != null ? `₹${top.last_price.toFixed(2)}` : "--"}
        />
      </div>
      <BiasBar
        className="mt-4"
        bias={top.opportunity_score}
        priceChange={top.price_change_pct}
      />
    </Card>
  );
}

type RankedListProps = {
  rankings: RankResponse;
};

function RankedList({ rankings }: RankedListProps) {
  if (!rankings.length) {
    return <Card title="Ranked Watchlist">No ranked symbols yet.</Card>;
  }
  return (
    <div className="grid gap-4">
      {rankings.map((item) => (
        <Card key={item.symbol} className="grid gap-4 md:grid-cols-[1fr_auto]" title={`${item.rank}. ${item.symbol}`}>
          <div className="space-y-4">
            <BiasBar bias={item.opportunity_score} priceChange={item.price_change_pct} />
            <div className="space-y-3">
              <div>
                <span className="text-xs uppercase tracking-wide text-slate-400">Daily Move</span>
                <p className="text-sm font-semibold text-white">{item.price_change_pct.toFixed(2)}%</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide text-slate-400">Price</span>
                <p className="text-sm font-semibold text-white">
                  {item.last_price != null ? `₹${item.last_price.toFixed(2)}` : "--"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-400">Summary</span>
                <h3 className="text-base font-semibold text-white">
                  {item.overview_heading ?? `${item.symbol} update`}
                </h3>
                <p className="text-sm text-slate-300">
                  {item.overview_summary ?? "No summary available yet."}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide text-slate-400">Sentiment</span>
                <p className="text-sm font-semibold text-white">{item.sentiment_label ?? "Neutral"}</p>
              </div>
              {item.headlines.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wide text-slate-400">Sources</span>
                  <ul className="mt-1 space-y-1 text-xs text-slate-400">
                    {item.headlines.map((headline) => (
                      <li key={headline.url}>
                        <span className="font-semibold text-slate-200">{headline.source ?? "Source"}</span>: {" "}
                        <a
                          href={headline.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-300 hover:text-sky-200"
                        >
                          {headline.headline || "View article"}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end justify-between gap-3">
            <ScorePill label="Opportunity" value={item.opportunity_score.toFixed(2)} variant="positive" />
            <KiteBuyButton symbol={item.symbol} variant="outline">
              Buy {item.symbol}
            </KiteBuyButton>
          </div>
        </Card>
      ))}
    </div>
  );
}
