"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Polls for updates at a given interval and calls onRefresh when changes detected.
 * Simple polling-based "real-time" — replace with WebSocket/SSE later.
 */
export function useRealtimeRefresh(
  endpoint: string,
  intervalMs: number = 15000,
  onRefresh: () => void
) {
  const lastHash = useRef<string | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      const text = await res.text();
      const hash = simpleHash(text);

      if (lastHash.current !== null && lastHash.current !== hash) {
        onRefresh();
      }
      lastHash.current = hash;
    } catch {
      // ignore
    }
  }, [endpoint, onRefresh]);

  useEffect(() => {
    check();
    const interval = setInterval(check, intervalMs);
    return () => clearInterval(interval);
  }, [check, intervalMs]);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return String(hash);
}
