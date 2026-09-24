/* ======================================================================
   Single source of truth for PDF page geometry.

   Everything that needs to agree on "how big is one page" imports from
   here: the CSS (via inline custom properties), html2canvas's capture
   options, and jsPDF's page format. Previously these were three
   separate, un-synced numbers (implicit in CSS, implicit in the
   slicing math, implicit in jsPDF's "a4" string) — that mismatch is
   what caused content to be cut at the wrong place.

   A4 @ 96 CSS px/inch:
     210mm × 297mm  ==  8.27in × 11.69in  ==  794px × 1123px
   ====================================================================== */

export const PDF_PAGE_WIDTH_PX = 794;
export const PDF_PAGE_HEIGHT_PX = 1123;

export const PDF_PAGE_WIDTH_MM = 210;
export const PDF_PAGE_HEIGHT_MM = 297;

/** Default html2canvas capture scale (2 = ~192dpi effective, crisp for text/logos). */
export const PDF_CAPTURE_SCALE = 2;
