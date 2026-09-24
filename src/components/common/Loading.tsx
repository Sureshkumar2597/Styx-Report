/**
 * Minimal, theme-aware loading state shown while `getReport()` resolves.
 * Deliberately lightweight — it only appears for a frame today since
 * mock data resolves instantly, but gives API integration a real place
 * to show progress later.
 */
export function Loading() {
  return (
    <div
      className="wrap"
      style={{
        padding: "80px 24px",
        textAlign: "center",
        color: "var(--text-mid)",
        fontFamily: "var(--mono)",
        fontSize: 13,
        letterSpacing: 1,
      }}
    >
      Loading report…
    </div>
  );
}
