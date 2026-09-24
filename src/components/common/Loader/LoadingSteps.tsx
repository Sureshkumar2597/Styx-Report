import { motion } from "framer-motion";

export const SCAN_STEPS = [
  "Collecting exposed assets",
  "Checking employee compromises",
  "Discovering exposed login portals",
  "Correlating threat intelligence",
  "Building executive report",
] as const;

interface LoadingStepsProps {
  activeStep: number;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

export function LoadingSteps({ activeStep }: LoadingStepsProps) {
  return (
    <ul className="ldg-steps" aria-label="Scan progress">
      {SCAN_STEPS.map((label, i) => {
        const isDone = i < activeStep;
        const isActive = i === activeStep;
        const status = isDone ? "is-done" : isActive ? "is-active" : "";

        return (
          <motion.li
            key={label}
            className={`ldg-step ${status}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: i <= activeStep ? 1 : 0.001,
              y: i <= activeStep ? 0 : 10,
            }}
            transition={{ duration: 0.45, ease: easeOut }}
          >
            <span className="ldg-step-icon">{isDone ? "✓" : ""}</span>
            {label}
          </motion.li>
        );
      })}
    </ul>
  );
}
