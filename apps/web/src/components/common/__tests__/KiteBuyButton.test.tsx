import React from "react";
import { render } from "@testing-library/react";

import { KiteBuyButton } from "@/components/common/KiteBuyButton";

describe("KiteBuyButton", () => {
  it("renders a Zerodha basket form with defaults", () => {
    const { container } = render(
      <KiteBuyButton symbol="TCS" apiKey="demo-key" redirectUrl="https://example.com/redirect" />,
    );

    const apiInput = container.querySelector("input[name='api_key']") as HTMLInputElement;
    const redirectInput = container.querySelector("input[name='redirect_url']") as HTMLInputElement;
    const dataInput = container.querySelector("input[name='data']") as HTMLInputElement;

    expect(apiInput.value).toBe("demo-key");
    expect(redirectInput.value).toBe("https://example.com/redirect");

    const payload = JSON.parse(dataInput.value);
    expect(Array.isArray(payload)).toBe(true);
    expect(payload[0].tradingsymbol).toBe("TCS");
    expect(payload[0].transaction_type).toBe("BUY");
    expect(payload[0].quantity).toBe(1);
  });

  it("respects order overrides", () => {
    const { container } = render(
      <KiteBuyButton
        symbol="INFY"
        apiKey="demo-key"
        redirectUrl="https://example.com/redirect"
        order={{ quantity: 5, order_type: "LIMIT", price: 1500 }}
      />,
    );
    const dataInput = container.querySelector("input[name='data']") as HTMLInputElement;
    const payload = JSON.parse(dataInput.value);
    expect(payload[0].quantity).toBe(5);
    expect(payload[0].order_type).toBe("LIMIT");
    expect(payload[0].price).toBe(1500);
  });
});
