"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { runAnalysis } from "@/app/actions/runAnalysis";
import { Button } from "@/components/ui/button";

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

type Props = {
  initialLastUpdated: string | null;
};

export function RunPipelineButton({ initialLastUpdated }: Props) {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<string | null>(initialLastUpdated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = useMemo(() => formatIST(lastUpdated), [lastUpdated]);

  const runPipeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runAnalysis();
      if (result.success) {
        setLastUpdated(result.lastUpdated ?? new Date().toISOString());
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Run pipeline failed", err);
      setError("Unable to run analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <Button onClick={runPipeline} disabled={loading} className="min-w-[150px]">
        {loading ? "Analyzing…" : "Run Analysis"}
      </Button>
      <span className="text-xs text-slate-400">Last updated (IST): {label}</span>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
