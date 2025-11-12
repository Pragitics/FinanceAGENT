import type { WatchlistItem } from "@financeagent/shared";

import { Button } from "@/components/ui/Button";

type Props = {
  items: WatchlistItem[];
  onRemove: (symbol: string) => void;
};

export function WatchlistList({ items, onRemove }: Props) {
  if (!items.length) {
    return <p className="text-sm text-slate-400">No symbols yet. Add your first ticker above.</p>;
  }
  return (
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
          <Button type="button" variant="outline" className="text-xs" onClick={() => onRemove(item.symbol)}>
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}
