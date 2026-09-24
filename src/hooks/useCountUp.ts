import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

/**
 * Animates a number from 0 up to `target` once the referenced element
 * scrolls into view, using the same eased timing as the original inline
 * implementation. Returns the ref to attach and the current value.
 */
export function useCountUp<T extends HTMLElement = HTMLDivElement>(
  target: number,
) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { amount: 0.4, once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const dur = 1400;
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return { ref, value };
}
