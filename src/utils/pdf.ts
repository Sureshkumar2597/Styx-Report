/* ======================================================================
   PDF GENERATION ENGINE.

   Old flow (removed):
     report-pdf-root → ONE html2canvas call → one giant canvas →
     sliced by (page height in px) → each slice added to jsPDF.

   That approach is why Hero/Summary split mid-content and the footer
   floated wherever the total-height math happened to land it: slicing
   a single canvas has no concept of "where a page boundary should be,"
   it only knows pixel offsets.

   New flow:
     For each `.pdf-page` element (each one already represents exactly
     one physical page, per PdfPage.tsx / pdf-print.css):
       1. html2canvas() captures THAT element only, at its fixed,
          known dimensions.
       2. The resulting image is added to jsPDF as a full page, 1:1.
       3. pdf.addPage() is called between pages (never after the last).

   No slicing function exists anymore. Page count is simply
   `document.querySelectorAll('.pdf-page').length` — it is not derived
   from dividing a total pixel height by a page height, which is the
   calculation that was going wrong before.
   ====================================================================== */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  PDF_PAGE_WIDTH_PX,
  PDF_PAGE_HEIGHT_PX,
  PDF_PAGE_WIDTH_MM,
  PDF_PAGE_HEIGHT_MM,
  PDF_CAPTURE_SCALE,
} from "../components/pdf/pdfPageDimensions";

export interface GenerateReportPdfOptions {
  /** Output filename. Only used if `download` is true. */
  filename?: string;
  /** html2canvas capture scale. Higher = crisper text/logos, larger file. */
  scale?: number;
  /** JPEG quality (0–1) for the per-page raster. */
  imageQuality?: number;
  /** If true, triggers a browser download; otherwise just returns the Blob. */
  download?: boolean;
  /** Called after each page is captured, e.g. for a progress bar. */
  onProgress?: (pageIndex: number, totalPages: number) => void;
}

export async function generateReportPdf(
  rootEl: HTMLElement,
  options: GenerateReportPdfOptions = {},
): Promise<Blob> {
  const {
    filename = "report.pdf",
    scale = PDF_CAPTURE_SCALE,
    imageQuality = 0.95,
    download = false,
    onProgress,
  } = options;

  const pageEls = Array.from(rootEl.querySelectorAll<HTMLElement>(".pdf-page"));

  if (pageEls.length === 0) {
    throw new Error(
      "generateReportPdf: no .pdf-page elements found inside root — " +
        "did ReportPdf render its content through <PdfPage>?",
    );
  }

  // ---- Temporary Light Theme override (PDF must always render light) ----
  const previousTheme = document.documentElement.getAttribute("data-theme");

  try {
    document.documentElement.setAttribute("data-theme", "light");

    // Wait two animation frames so React/CSS have fully repainted
    // before html2canvas captures anything.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    for (let i = 0; i < pageEls.length; i++) {
      const pageEl = pageEls[i];

      const canvas = await html2canvas(pageEl, {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: PDF_PAGE_WIDTH_PX,
        height: PDF_PAGE_HEIGHT_PX,
        windowWidth: PDF_PAGE_WIDTH_PX,
        windowHeight: PDF_PAGE_HEIGHT_PX,
      });

      const imageData = canvas.toDataURL("image/jpeg", imageQuality);

      if (i > 0) {
        pdf.addPage("a4", "portrait");
      }

      pdf.addImage(
        imageData,
        "JPEG",
        0,
        0,
        PDF_PAGE_WIDTH_MM,
        PDF_PAGE_HEIGHT_MM,
      );

      if (i === 5) {
        pdf.link(10, 170, 190, 100, {
          url: "https://styxintel.com/book-a-demo?utm_source=riskreport&utm_medium=cta&utm_campaign=book_a_demo",
        });
      }
      if (i === 1) {
        pdf.link(120, 228, 40, 15, {
          url: "https://styxintel.com/book-a-demo?utm_source=riskreport&utm_medium=cta&utm_campaign=book_a_demo",
        });
      }
      if (i === 2) {
        pdf.link(160, 230, 40, 12, {
          url: "https://styxintel.com/book-a-demo?utm_source=riskreport&utm_medium=cta&utm_campaign=book_a_demo",
        });
      }
      if (i === 3) {
        pdf.link(126, 248, 36, 6, {
          url: "https://styxintel.com/book-a-demo?utm_source=riskreport&utm_medium=cta&utm_campaign=book_a_demo",
        });
      }

      onProgress?.(i + 1, pageEls.length);
      onProgress?.(i + 1, pageEls.length);
    }

    const blob = pdf.output("blob");

    if (download) {
      pdf.save(filename);
    }

    return blob;
  } finally {
    // Always restore the user's actual theme, success or failure.
    if (previousTheme) {
      document.documentElement.setAttribute("data-theme", previousTheme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }
}
