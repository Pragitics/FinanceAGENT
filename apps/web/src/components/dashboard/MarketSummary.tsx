import type { RankResponse } from "@financeagent/shared";

import { Card } from "@/components/ui/Card";
import { BiasBar } from "@/components/common/BiasBar";
import { ScorePill } from "@/components/common/ScorePill";

type Props = {
  rankings: RankResponse;
};

export function MarketSummary({ rankings }: Props) {
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
        <ScorePill label="Price" value={top.last_price != null ? `₹${top.last_price.toFixed(2)}` : "--"} />
      </div>
      <BiasBar className="mt-4" bias={top.opportunity_score} priceChange={top.price_change_pct} />
    </Card>
  );
}
