import { motion } from "framer-motion";

const STAT_LABELS = [
  "Compromised Employees",
  "Compromised Users",
  "Exposed URLs",
  "Sensitive Applications",
] as const;

const easeOut = [0.16, 1, 0.3, 1] as const;

export function LoadingStats() {
  return (
    <div className="ldg-stats">
      {STAT_LABELS.map((label, i) => (
        <motion.div
          key={label}
          className="ldg-stat-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 + i * 0.08, ease: easeOut }}
        >
          <div
            className="ldg-stat-placeholder ldg-shimmer"
            aria-hidden="true"
          />
          <div className="ldg-stat-label">{label}</div>
        </motion.div>
      ))}
    </div>
  );
}
