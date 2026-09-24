// src/components/pdf/PdfPage.tsx
/* ======================================================================
   PDF-ONLY component. Never rendered on the interactive website.

   `header`: optional custom header element. When provided, it's rendered
   instead of the default <PdfHeader /> overlay — this is how page 2/3/4
   swap in <PdfHeaderBanner /> without PdfPage needing to know anything
   about what a "banner" or "overlay" header actually looks like. Pages
   that don't pass `header` behave exactly as before (Hero's page 1).

   `hideHeader` / `hideFooter`: suppress the header/footer entirely,
   used by the standalone cover page (page 1) which needs no chrome
   at all.
   ====================================================================== */

import type { ReactNode } from "react";
import { PdfHeader } from "./PdfHeader";
import { PdfFooter } from "./PdfFooter";

interface PdfPageProps {
  children: ReactNode;
  pageNumber: number;
  totalPages: number;
  bleedTop?: boolean;
  centerContent?: boolean;
  /** Custom header element. Defaults to the transparent <PdfHeader /> overlay. */
  header?: ReactNode;
  /** Suppress the header entirely (no default <PdfHeader /> fallback either). */
  hideHeader?: boolean;
  /** Suppress the footer entirely. */
  hideFooter?: boolean;
}

export function PdfPage({
  children,
  pageNumber,
  totalPages,
  bleedTop = false,
  centerContent = false,
  header,
  hideHeader = false,
  hideFooter = false,
}: PdfPageProps) {
  const bodyClassName = [
    "pdf-page-body",
    bleedTop ? "pdf-page-body--bleed-top" : "",
    centerContent ? "pdf-page-body--centered" : "",
    header ? "pdf-page-body--has-banner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="pdf-page" data-pdf-page={pageNumber}>
      {!hideHeader && (header ?? <PdfHeader />)}
      <div className={bodyClassName}>{children}</div>
      {!hideFooter && (
        <PdfFooter pageNumber={pageNumber} totalPages={totalPages} />
      )}
    </section>
  );
}

export default PdfPage;
