import { motion, useReducedMotion } from "framer-motion";
import { LoadingMessages } from "./LoadingMessages";

interface LoadingHeroProps {
  domain: string;
  messageIndex: number;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

/**
 * This is deliberately just the real Hero markup (same classes as
 * Hero.tsx: .hero / .hero-inner / .hero-grid / .hero-stat) so the
 * background gradient, glow, spacing, and type styles are pulled
 * from the single source of truth in the main stylesheet — nothing
 * here redefines a "loading" background. Only the content inside
 * is swapped for shimmer/rotating text until real data lands, so
 * the crossfade into <Hero data={...} /> has zero layout shift.
 */
export function LoadingHero({ domain, messageIndex }: LoadingHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  const entrance = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: easeOut },
      };

  return (
    <header className="hero">
      <div className="wrap hero-inner">
        <motion.div className="live-badge" {...entrance}>
          <span className="live-dot" />
          Live scan in progress
        </motion.div>

        <div className="hero-grid">
          <motion.div {...entrance}>
            <p className="hero-headline">External Cyber Risk Assessment</p>
            <h1 className="hero-title">{domain}</h1>
            <div className="hero-meta">
              Scanning now &nbsp;·&nbsp; <strong>Real-time</strong>{" "}
              &nbsp;·&nbsp; Target: {domain}
            </div>
            <div className="hero-desc ldg-desc-wrap">
              <LoadingMessages messageIndex={messageIndex} />
            </div>
          </motion.div>

          <motion.div className="hero-stat" aria-hidden="true" {...entrance}>
            <div className="ldg-bar ldg-shimmer ldg-stat-shimmer" />
            <div className="hero-stat-label">Calculating risk score…</div>
          </motion.div>
        </div>

        <motion.div className="preview-strip" {...entrance}>
          <strong>Live:</strong> Building your personalized security report…
        </motion.div>
      </div>
    </header>
  );
}
