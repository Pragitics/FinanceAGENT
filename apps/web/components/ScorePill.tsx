import { twMerge } from "tailwind-merge";

type ScorePillProps = {
  label: string;
  value: number | string;
  variant?: "neutral" | "positive" | "negative";
  className?: string;
};

export function ScorePill({ label, value, variant = "neutral", className }: ScorePillProps) {
  const colors: Record<ScorePillProps["variant"], string> = {
    neutral: "bg-slate-700 text-slate-100",
    positive: "bg-positive/20 text-positive",
    negative: "bg-negative/20 text-negative",
  };
  return (
    <span
      className={twMerge(
        "inline-flex flex-col rounded-md px-3 py-2 text-xs uppercase tracking-wide",
        colors[variant],
        className,
      )}
    >
      <span className="text-[0.65rem] text-slate-300">{label}</span>
      <span className="text-base font-semibold">{value}</span>
    </span>
  );
}
