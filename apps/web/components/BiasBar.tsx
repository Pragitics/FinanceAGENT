import { twMerge } from "tailwind-merge";

export type BiasBarProps = {
  bias: number;
  priceChange: number;
  className?: string;
};

export function BiasBar({ bias, priceChange, className }: BiasBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round((bias + 10) * 5)));
  const direction = bias >= 0 ? "positive" : "negative";
  const barClass = direction === "positive" ? "bg-positive" : "bg-negative";
  return (
    <div className={twMerge("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Opportunity score</span>
        <span className="font-semibold text-slate-200">{bias.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800">
        <div className={twMerge("h-2 rounded-full transition-all", barClass)} style={{ width: `${clamped}%` }} />
      </div>
      <div className="flex justify-between text-[0.7rem] text-slate-400">
        <span>Price move: {priceChange.toFixed(2)}%</span>
      </div>
    </div>
  );
}
