// utils/formatMetric.ts

/**
 * Central rule for how a numeric metric + suffix should be displayed.
 *
 * A suffix like "+" means "at least this many" / "this many or more".
 * That reads correctly for positive values ("5+", "12+") but is
 * misleading at zero — "0+" implies "zero or more", which is trivially
 * true of everything and communicates nothing. So the suffix is
 * suppressed specifically at 0, and preserved for every other value
 * (including negative, in case that's ever meaningful upstream).
 *
 * `target === 0` is treated as fully valid, real data here — this
 * function only affects display formatting, never loading/missing
 * state, which is handled separately (see Summary.tsx / isLoading).
 */
export function formatMetricValue(
  target: number,
  suffix?: string,
): { display: string; suffix: string } {
  const safeSuffix = suffix ?? "";
  const effectiveSuffix = target === 0 ? "" : safeSuffix;

  return {
    display: `${target}${effectiveSuffix}`,
    suffix: effectiveSuffix,
  };
}
