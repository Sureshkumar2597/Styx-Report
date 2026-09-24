import { CountUp } from "../charts/CountUp";
import { Card } from "../common/Card";
import type { SummaryData, StatCard } from "../../types/report";
import { useReveal } from "../../context/RevealContext";

interface SummaryProps {
  data: SummaryData;
  /**
   * Explicit loading flag owned by the parent (e.g. from your
   * fetch/query hook's `isLoading`/`isPending`). This is the ONLY
   * source of truth for whether to show skeletons. It is never
   * inferred from the shape or values of `data`.
   */
  isLoading: boolean;
  /** Optional: how many skeleton cards to show while loading. */
  skeletonCount?: number;
}

/**
 * A stat card is only considered malformed (and dropped) if it is
 * missing the fields required to render at all — a label to show,
 * or a target that never arrived. `target === 0` is a fully valid,
 * real value and must render as "0", not be treated as absent.
 */
function isRenderableCard(card: StatCard | null | undefined): card is StatCard {
  return (
    !!card &&
    typeof card.label === "string" &&
    card.label.trim().length > 0 &&
    card.target !== null &&
    card.target !== undefined &&
    !Number.isNaN(Number(card.target))
  );
}

export function Summary({ data, isLoading, skeletonCount = 4 }: SummaryProps) {
  const { isRevealed } = useReveal();
  if (isLoading) {
    return (
      <section className="wrap" id="summary">
        <p className="eyebrow">
          What we found — from entirely outside your network
        </p>

        <h2 className="section-title">
          <span className="orange">7 signals,</span>{" "}
          <span className="red">1 exposed perimeter</span>
        </h2>

        <p className="section-sub">
          This is what's already circulating on stealer log marketplaces today —
          no credentials, penetration testing, or internal access required to
          surface it.
        </p>

        <div
          className="stat-grid"
          style={{ marginTop: 28 }}
          data-loading="true"
        >
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Card key={i} className="stat-card">
              <div className="stat-card-inner">
                <div className="stat-label">
                  <span className="ldg-bar ldg-shimmer ldg-skel-stat-label-line" />
                </div>
                <div className="stat-num">
                  <span className="ldg-bar ldg-shimmer ldg-skel-stat-num" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <ul className="summary-list">
          {Array.from({ length: data.bullets.length || 4 }).map((_, i) => (
            <li key={i}>
              <span className="marker">▪</span>
              <span className="txt">
                <span
                  className={`ldg-bar ldg-shimmer ldg-skel-bullet-line ldg-skel-bullet-${
                    i + 1
                  }`}
                />
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Loading has completed. Render exactly what the API returned — no
  // padding, no placeholder slots, no guessing. Only drop entries that
  // are structurally incomplete (no label / target genuinely never
  // arrived), never entries whose value happens to be 0.
  const cards = data.statCards.filter(isRenderableCard);

  return (
    <section className="wrap" id="summary">
      <p className="eyebrow">
        What we found — from entirely outside your network
      </p>

      <h2 className="section-title">
        <span className="orange">7 signals,</span>{" "}
        <span className="red">1 exposed perimeter</span>
      </h2>

      <p className="section-sub">
        This is what's already circulating on stealer log marketplaces today —
        no credentials, penetration testing, or internal access required to
        surface it.
      </p>

      {cards.length > 0 ? (
        <div
          className="stat-grid"
          style={{ marginTop: 28 }}
          data-count={cards.length}
        >
          {cards.map((s, i) => (
            <Card
              key={i}
              className="stat-card"
              style={{ borderColor: s.color }}
            >
              <div className="stat-card-inner">
                <div className="stat-label">{s.label}</div>
                <CountUp
                  target={s.target}
                  suffix={s.suffix}
                  className="stat-num"
                  style={{ color: s.color }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Requirement 2: after loading, an empty result hides the
        // section (or shows this optional message) — never skeletons.
        <p className="stat-empty" style={{ marginTop: 28 }}>
          No data available.
        </p>
      )}

      {/* Greyed-out teaser list */}
      <ul className="summary-list">
        {data.bullets.map((html, i) => {
          const empty = !html || !html.trim();
          if (empty) return null;

          return (
            <li key={i}>
              <span className="marker">▪</span>
              <span className="txt">
                <span
                  dangerouslySetInnerHTML={{
                    __html: isRevealed
                      ? html.replaceAll(
                          'class="blur-text"',
                          'class="blur-text revealed"',
                        )
                      : html,
                  }}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
