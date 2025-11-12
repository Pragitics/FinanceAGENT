import { useMemo } from "react";

import { Button } from "@/components/ui/Button";

type Props = {
  lastUpdated: string | null;
  onRun: () => void;
  running: boolean;
  error: string | null;
};

function formatIST(timestamp: string | null): string {
  if (!timestamp) {
    return "Not run yet";
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Not run yet";
  }
  return date.toLocaleString("en-IN", {
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

export function RunAnalysisPanel({ lastUpdated, onRun, running, error }: Props) {
  const label = useMemo(() => formatIST(lastUpdated), [lastUpdated]);

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <Button onClick={onRun} disabled={running} className="min-w-[150px]">
        {running ? "Analyzing…" : "Run Analysis"}
      </Button>
      <span className="text-xs text-slate-400">Last updated (IST): {label}</span>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
