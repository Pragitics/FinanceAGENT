import type { Recommendation } from "@financeagent/shared";

import { Card } from "@/components/ui/Card";
import { KiteBuyButton } from "@/components/common/KiteBuyButton";

type Props = {
  recommendation: Recommendation | null;
};

export function RecommendationCard({ recommendation }: Props) {
  const hasPick = Boolean(recommendation?.symbol);
  return (
    <Card title="Today's Opportunity" subtitle="Avoid repeats unless a major correction occurs.">
      {hasPick && recommendation ? (
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
        <p className="text-sm text-slate-300">
          {recommendation?.reason ?? "No significant dip today. Run analysis to generate a pick."}
        </p>
      )}
    </Card>
  );
}
