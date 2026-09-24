import { useEffect, useState } from "react";

/**
 * Drives the rotating status message in the loading hero. Loops for
 * as long as we're mounted, since real API latency can exceed the
 * scripted message list. Scan-steps timer removed along with the
 * steps UI — this is the only timer left in the loading experience.
 */
export function useScanSequence(
  messageCount: number,
  messageIntervalMs = 2200,
) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (messageCount <= 1) return;

    const id = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messageCount);
    }, messageIntervalMs);

    return () => window.clearInterval(id);
  }, [messageCount, messageIntervalMs]);

  return { messageIndex };
}
