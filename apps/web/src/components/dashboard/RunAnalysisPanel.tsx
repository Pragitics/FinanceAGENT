import { useMemo } from "react";

import { Button } from "@/components/ui/Button";

type Props = {
  lastUpdated: string | null;
  onRun: () => void;
  running: boolean;
  error: string | null;
  perplexityKey: string;
  onPerplexityKeyChange: (value: string) => void;
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

export function RunAnalysisPanel({
  lastUpdated,
  onRun,
  running,
  error,
  perplexityKey,
  onPerplexityKeyChange,
}: Props) {
  const label = useMemo(() => formatIST(lastUpdated), [lastUpdated]);

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <label className="flex w-full max-w-xs flex-col gap-2 text-xs text-slate-300">
        Perplexity API key (optional)
        <input
          type="password"
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
          placeholder="pplx-..."
          value={perplexityKey}
          onChange={(event) => onPerplexityKeyChange(event.target.value)}
          autoComplete="off"
        />
        <span className="text-[11px] text-slate-500">
          Stored locally only. Used for live summaries if provided.
        </span>
      </label>
      <Button onClick={onRun} disabled={running} className="min-w-[150px]">
        {running ? "Analyzing…" : "Run Analysis"}
      </Button>
      <span className="text-xs text-slate-400">Last updated (IST): {label}</span>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
