import { AnimatePresence, motion } from "framer-motion";

export const SCAN_MESSAGES = [
  "Scanning external attack surface…",
  "Checking exposed employee credentials…",
  "Analyzing exposed portals…",
  "Correlating cyber intelligence…",
  "Building security report…",
] as const;

interface LoadingMessagesProps {
  messageIndex: number;
}

/**
 * No wrapper styling of its own anymore — it renders inside
 * .hero-desc (see LoadingHero.tsx), so it inherits the exact same
 * font/size/line-height as the real hero description instead of
 * carrying its own typography.
 */
export function LoadingMessages({ messageIndex }: LoadingMessagesProps) {
  const message = SCAN_MESSAGES[messageIndex % SCAN_MESSAGES.length];

  return (
    <span role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.span
          key={message}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ display: "inline-block" }}
        >
          {message}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
