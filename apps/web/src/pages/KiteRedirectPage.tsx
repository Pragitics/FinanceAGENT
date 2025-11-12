import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";

export function KiteRedirectPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const { isSuccess, heading, description, reference } = useMemo(() => {
    const status = (params.get("status") || "success").toLowerCase();
    const requestId = params.get("request_id") || params.get("order_id");
    const message = params.get("message") || params.get("error_description");
    const ok = status !== "error";
    return {
      isSuccess: ok,
      heading: ok ? "Order basket sent to Kite" : "We could not confirm your order yet",
      description:
        message ||
        (ok
          ? "You can close this tab and continue in Kite. Once you place the order, return to FinanceAGENT to monitor the position."
          : "Kite returned an unexpected response. Please try again from the dashboard or verify your Kite session."),
      reference: requestId,
    };
  }, [params]);

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-950 px-6 py-10">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-lg">
        <h1 className="text-2xl font-semibold text-white">{heading}</h1>
        <p className="mt-3 text-sm text-slate-300">{description}</p>
        {reference && (
          <p className="mt-2 text-xs text-slate-500">
            Reference ID: <span className="font-mono">{reference}</span>
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={() => navigate("/", { replace: true })}>
            Back to dashboard
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/watchlist")}>
            View watchlist
          </Button>
        </div>
      </div>
    </main>
  );
}
