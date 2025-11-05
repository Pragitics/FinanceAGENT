"use client";

import { useTransition } from "react";

import { deleteSymbol } from "@/app/watchlist/actions";
import { Button } from "@/components/ui/button";

export function DeleteWatchlistButton({ symbol }: { symbol: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      className="text-xs"
      onClick={() => startTransition(async () => deleteSymbol(symbol))}
      disabled={pending}
    >
      {pending ? "Removing..." : "Remove"}
    </Button>
  );
}
