import { describe, expect, it } from "vitest";
import { useConnectionStore } from "./connection";

describe("useConnectionStore", () => {
  it("keeps the status per provider and counts reconnects after the first connection", () => {
    const { setStatus } = useConnectionStore.getState();
    setStatus("binance", "connecting");
    setStatus("binance", "connected");
    expect(useConnectionStore.getState().status.binance).toBe("connected");
    expect(useConnectionStore.getState().reconnects.binance).toBeUndefined();

    setStatus("binance", "disconnected");
    setStatus("binance", "connecting");
    setStatus("binance", "connected");
    setStatus("binance", "connected");
    expect(useConnectionStore.getState().reconnects.binance).toBe(1);
    expect(useConnectionStore.getState().status).toEqual({ binance: "connected" });
  });
});
