import type { ReactNode } from "react";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";

import { Button } from "@/components/ui/Button";
import { appConfig } from "@/core/config";

export type KiteOrderOverrides = {
  exchange?: string;
  transaction_type?: "BUY" | "SELL";
  order_type?: string;
  quantity?: number;
  price?: number;
  product?: string;
  validity?: string;
};

type KiteBuyButtonProps = {
  symbol: string;
  className?: string;
  variant?: "default" | "outline";
  children?: ReactNode;
  order?: KiteOrderOverrides;
  apiKey?: string;
  redirectUrl?: string;
};

const DEFAULT_ORDER = {
  exchange: "NSE",
  transaction_type: "BUY" as const,
  order_type: "MARKET",
  quantity: 1,
  product: "CNC",
  validity: "DAY",
};

export function KiteBuyButton({
  symbol,
  className,
  variant = "default",
  children,
  order,
  apiKey = appConfig.kitePublisherKey,
  redirectUrl = appConfig.kiteRedirectUrl,
}: KiteBuyButtonProps) {
  const orderPayload = useMemo(() => {
    const merged = { ...DEFAULT_ORDER, ...order };
    return [
      {
        exchange: merged.exchange,
        tradingsymbol: symbol,
        transaction_type: merged.transaction_type,
        order_type: merged.order_type,
        quantity: merged.quantity,
        price: merged.price,
        product: merged.product,
        validity: merged.validity,
      },
    ];
  }, [order, symbol]);

  return (
    <form
      action="https://kite.zerodha.com/connect/basket"
      method="post"
      target="_blank"
      rel="noreferrer"
      className={twMerge("inline-flex", className)}
    >
      <input type="hidden" name="api_key" value={apiKey} />
      <input type="hidden" name="redirect_url" value={redirectUrl} />
      <input type="hidden" name="data" value={JSON.stringify(orderPayload)} />
      <Button type="submit" variant={variant}>
        {children ?? `Buy ${symbol}`}
      </Button>
    </form>
  );
}
