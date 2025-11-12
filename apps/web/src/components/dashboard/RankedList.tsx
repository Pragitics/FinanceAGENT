import type { RankResponse } from "@financeagent/shared";

import { Card } from "@/components/ui/Card";
import { BiasBar } from "@/components/common/BiasBar";
import { ScorePill } from "@/components/common/ScorePill";
import { KiteBuyButton } from "@/components/common/KiteBuyButton";

type Props = {
  rankings: RankResponse;
};

export function RankedList({ rankings }: Props) {
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
                <h3 className="text-base font-semibold text-white">{item.overview_heading ?? `${item.symbol} update`}</h3>
                <p className="text-sm text-slate-300">{item.overview_summary ?? "No summary available yet."}</p>
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
                        <span className="font-semibold text-slate-200">{headline.source ?? "Source"}</span>:{" "}
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
