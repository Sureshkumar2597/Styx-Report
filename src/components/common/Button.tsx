import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Extra classes appended after the base className passed in. */
  className?: string;
}

/**
 * Thin passthrough wrapper so buttons across the app share one import
 * path. Intentionally unopinionated about styling — callers supply the
 * exact className (e.g. "top-cta", "filter-btn active") so existing
 * visuals are preserved exactly.
 */
export function Button({ children, className, ...rest }: ButtonProps) {
  return (
    <button className={className} {...rest}>
      {children}
    </button>
  );
}
