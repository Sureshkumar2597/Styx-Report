import type { CSSProperties } from "react";
import { useCountUp } from "../../hooks/useCountUp";
import { usePdfMode } from "../../context/PdfModeContext";
import { formatMetricValue } from "../../utils/formatMetric";

interface CountUpProps {
  target: number;
  suffix?: string;
  className?: string;
  style?: CSSProperties;
}

export function CountUp({
  target,
  suffix = "",
  className,
  style,
}: CountUpProps) {
  const isPdf = usePdfMode();

  // Always call the hook to preserve hook ordering.
  const { ref, value } = useCountUp<HTMLDivElement>(target);

  const displayValue = isPdf ? target : value;

  // Suffix is derived from `target` (the final value), not `value`
  // (the in-flight animated number). While counting up toward a
  // non-zero target, `value` passes through 0 on its way there — if
  // the suffix were tied to `value`, that would flash "0+" for a
  // frame before settling. Tying it to `target` means a genuinely
  // zero target shows "0", and a positive target shows its suffix
  // for the entire animation, including the very first frame.
  const { suffix: effectiveSuffix } = formatMetricValue(target, suffix);

  return (
    <div ref={ref} className={className} style={style}>
      {displayValue.toLocaleString()}
      {effectiveSuffix}
    </div>
  );
}
