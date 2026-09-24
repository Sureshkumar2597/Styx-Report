import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  label?: string;
  className?: string;
  id?: string;
}

/**
 * Wraps the repeated `.panel` + `.panel-label` pattern used throughout
 * the password-strength / hygiene sections.
 */
export function Panel({ children, label, className = "", id }: PanelProps) {
  return (
    <div className={`panel ${className}`.trim()} id={id}>
      {label && <div className="panel-label">{label}</div>}
      {children}
    </div>
  );
}
