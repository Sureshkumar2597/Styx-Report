/* ======================================================================
   USE NETWORK STATUS
   Reusable, presence-agnostic wrapper around the browser's online/offline
   events. Single responsibility: report whether the browser currently
   believes it has connectivity. No caching, no retries, no domain logic
   — callers decide what to do with the value.
   ====================================================================== */

import { useEffect, useState } from "react";

export interface UseNetworkStatusResult {
  isOnline: boolean;
}

function getCurrentOnlineStatus(): boolean {
  // navigator.onLine is undefined in non-browser environments (SSR/tests).
  // Default to "online" in that case so we never falsely block on a
  // platform that simply doesn't expose the API.
  if (
    typeof navigator === "undefined" ||
    typeof navigator.onLine !== "boolean"
  ) {
    return true;
  }
  return navigator.onLine;
}

export function useNetworkStatus(): UseNetworkStatusResult {
  const [isOnline, setIsOnline] = useState<boolean>(getCurrentOnlineStatus);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Re-sync in case status changed between the initial render (module
    // eval time) and mount (e.g. hydration, StrictMode double-invoke).
    setIsOnline(getCurrentOnlineStatus());

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}
