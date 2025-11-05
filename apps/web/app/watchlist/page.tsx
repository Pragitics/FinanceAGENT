import Link from "next/link";

import { Card } from "@/components/ui/card";
import { DeleteWatchlistButton } from "@/components/DeleteWatchlistButton";
import { AddSymbolForm } from "./AddSymbolForm";
import { getWatchlist } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

export default async function WatchlistPage() {
  await requireAuth();
  const items = await getWatchlist();
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Watchlist</h1>
          <p className="text-sm text-slate-400">Curate 5–10 symbols to feed the opportunity score engine.</p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Back to dashboard
        </Link>
      </header>
      <section className="mt-8 grid gap-6">
        <Card title="Add symbol">
          <AddSymbolForm />
        </Card>
        <Card title="Current symbols">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400">No symbols yet. Add your first ticker above.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-50">{item.symbol}</p>
                    <p className="text-xs text-slate-400">{item.exchange}</p>
                  </div>
                  <DeleteWatchlistButton symbol={item.symbol} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </main>
  );
}
