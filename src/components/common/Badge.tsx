import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  /** e.g. "badge badge-active" or "sev-badge sev-critical" */
  className: string;
}

/** Small pill/label used for severity tags, status badges, etc. */
export function Badge({ children, className }: BadgeProps) {
  return <span className={className}>{children}</span>;
}
