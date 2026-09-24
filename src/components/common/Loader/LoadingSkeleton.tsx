import { motion } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1] as const;

function reveal(delay: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: easeOut },
  };
}

/**
 * Mirrors the real report's section order and structural CSS classes
 * so the crossfade into <Dashboard> never shifts layout — only the
 * real content fades in where shimmer bars used to be.
 *
 * FIX: bullet lines and stat-card placeholders were rendering as empty
 * space (no visible shimmer) because their sizing was in `em`, relative
 * to a parent font-size/line-height context that wasn't reliably present
 * on the live page. Every placeholder below now has an explicit px
 * width/height (in loading.css), and `.ldg-bar` itself has a min-width/
 * min-height safety net, so a shimmer can never collapse to zero size.
 */
export function LoadingSkeleton() {
  return (
    <div className="ldg-skeleton">
      {/* Summary — DOM-identical to Summary.tsx, content-only swap */}
      <section className="ldg-section" aria-hidden="true">
        <div className="wrap">
          <motion.div {...reveal(0.05)}>
            <p className="eyebrow">
              <span className="ldg-bar ldg-shimmer ldg-skel-eyebrow" />
            </p>

            <h2 className="section-title">
              <span className="orange">
                <span className="ldg-bar ldg-shimmer ldg-skel-title-orange" />
              </span>{" "}
              <span className="red">
                <span className="ldg-bar ldg-shimmer ldg-skel-title-red" />
              </span>
            </h2>

            <p className="section-sub">
              <span className="ldg-bar ldg-shimmer ldg-skel-sub-line ldg-skel-sub-line-full" />
              <span className="ldg-bar ldg-shimmer ldg-skel-sub-line ldg-skel-sub-line-partial" />
            </p>

            <ul className="summary-list">
              {Array.from({ length: 7 }).map((_, i) => (
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

            <div className="stat-grid cards-4" style={{ marginTop: 28 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="stat-card ldg-skel-stat-card">
                  <div className="stat-card-inner">
                    <div className="stat-label">
                      <span className="ldg-bar ldg-shimmer ldg-skel-stat-label-line" />
                    </div>
                    <div className="stat-num">
                      <span className="ldg-bar ldg-shimmer ldg-skel-stat-num" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Spotlight */}
      <section className="ldg-section" aria-hidden="true">
        <div className="wrap">
          <motion.div {...reveal(0.1)} className="spot-box">
            <div className="spot-head">
              <div className="ldg-bar ldg-shimmer ldg-skel-title" />
              <span className="badge badge-active">SPOTLIGHT</span>
            </div>
            <div className="ldg-bar ldg-shimmer ldg-skel-line" />
            <div className="ldg-bar ldg-shimmer ldg-skel-line" />
            <div className="mini-stats">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mini-stat">
                  <div className="ldg-bar ldg-shimmer ldg-skel-line" />
                  <div className="ldg-bar ldg-shimmer ldg-skel-line" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="ldg-section" aria-hidden="true">
        <div className="wrap">
          <motion.div {...reveal(0.15)} className="timeline-box">
            <div className="chart-legend">
              <div className="ldg-bar ldg-shimmer ldg-skel-legend-item" />
              <div className="ldg-bar ldg-shimmer ldg-skel-legend-item" />
            </div>
            <div className="ldg-bar ldg-shimmer ldg-skel-chart" />
          </motion.div>
        </div>
      </section>

      {/* Findings */}
      <section className="ldg-section" aria-hidden="true">
        <div className="wrap">
          <motion.div {...reveal(0.2)}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="finding">
                <span className="sev-badge sev-medium ldg-sev-ghost">
                  &nbsp;
                </span>
                <div>
                  <div className="ldg-bar ldg-shimmer ldg-skel-title-wide" />
                  <div className="ldg-bar ldg-shimmer ldg-skel-title-full" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Password strength */}
      <section className="ldg-section" aria-hidden="true">
        <div className="wrap">
          <motion.div {...reveal(0.25)} className="two-col">
            <div className="panel">
              <div className="ldg-bar ldg-shimmer ldg-skel-title" />
              <div className="ldg-bar ldg-shimmer ldg-skel-donut" />
            </div>
            <div className="panel">
              <div className="ldg-bar ldg-shimmer ldg-skel-title" />
              <div className="ldg-bar ldg-shimmer ldg-skel-hygiene" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Malware families */}
      <section className="ldg-section" aria-hidden="true">
        <div className="wrap">
          <motion.div {...reveal(0.3)} className="panel">
            <div className="ldg-bar ldg-shimmer ldg-skel-title" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="fam-row">
                <div className="ldg-bar ldg-shimmer ldg-skel-line" />
                <div className="fam-track">
                  <div className="ldg-bar ldg-shimmer ldg-skel-fill" />
                </div>
                <div className="ldg-bar ldg-shimmer ldg-skel-line" />
                <div className="ldg-bar ldg-shimmer ldg-skel-line" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Locked reports */}
      <section className="ldg-section" aria-hidden="true">
        <div className="wrap">
          <motion.div {...reveal(0.35)} className="locked-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="locked-card">
                <div className="ldg-bar ldg-shimmer ldg-skel-title" />
                <div className="redact-lines">
                  <div className="ldg-bar ldg-shimmer redact-line ldg-skel-redact-1" />
                  <div className="ldg-bar ldg-shimmer redact-line ldg-skel-redact-2" />
                  <div className="ldg-bar ldg-shimmer redact-line ldg-skel-redact-3" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
