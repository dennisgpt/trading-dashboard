import { create } from "zustand";
import type { ProviderRegistry } from "@/core/market/registry";
import type { ConnectionStatus } from "@/core/market/types";

interface ConnectionState {
  /** Connection status per provider id. */
  status: Record<string, ConnectionStatus>;
  /**
   * Counts how often a provider connected again after an earlier connection. Panels watch it to
   * reload history that may have gaps from the time the connection was down.
   */
  reconnects: Record<string, number>;
  setStatus: (providerId: string, status: ConnectionStatus) => void;
}

const everConnected = new Set<string>();

export const useConnectionStore = create<ConnectionState>()((set) => ({
  status: {},
  reconnects: {},
  setStatus: (providerId, status) =>
    set((state) => {
      if (state.status[providerId] === status) return state;
      let reconnects = state.reconnects;
      if (status === "connected") {
        if (everConnected.has(providerId)) reconnects = { ...reconnects, [providerId]: (reconnects[providerId] ?? 0) + 1 };
        everConnected.add(providerId);
      }
      return { status: { ...state.status, [providerId]: status }, reconnects };
    }),
}));

/** Mirrors the connection status of every registered provider into the store. Returns a cleanup function. */
export function trackConnectionStatus(registry: ProviderRegistry): () => void {
  const { setStatus } = useConnectionStore.getState();
  const unsubscribers = registry.list().map((provider) => provider.subscribeStatus((status) => setStatus(provider.id, status)));
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
