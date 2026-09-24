import { forwardRef, type ReactNode } from "react";

interface SectionProps {
  id?: string;
  children: ReactNode;
  /** Extra classes appended to the base "wrap" class. */
  className?: string;
}

/**
 * Every content section in the original markup was `<section className="wrap" id="...">`.
 * This wrapper keeps that consistent and lets sections that need a
 * scroll/animation ref (like the unlock section) forward one in.
 */
export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ id, children, className = "" }, ref) => {
    return (
      <section id={id} className={`wrap ${className}`.trim()} ref={ref}>
        {children}
      </section>
    );
  },
);

Section.displayName = "Section";
