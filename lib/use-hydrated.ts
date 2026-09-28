import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false during server rendering and the first client render, true after
 * hydration. Use it to show browser-only state (the persisted cart) without
 * a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
