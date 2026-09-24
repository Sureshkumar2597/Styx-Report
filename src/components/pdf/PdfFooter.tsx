import styxLogo from "../../../src/assets/images/styx-white-logo.svg";

const STYX_LOGO_URL = styxLogo;

interface PdfFooterProps {
  pageNumber: number;
  totalPages: number;
}

export function PdfFooter({ pageNumber, totalPages }: PdfFooterProps) {
  return (
    <div className="pdf-footer" data-pdf-block>
      <img
        className="pdf-footer-logo"
        src={STYX_LOGO_URL}
        alt="Styx Intelligence"
      />

      <div className="pdf-footer-meta">
        <span className="pdf-footer-page">
          Page {pageNumber}
          {totalPages > 1 ? ` ` : ""} · Private &amp; Confidential
        </span>
        <span className="pdf-footer-copyright">
          © {new Date().getFullYear()} Styx Intelligence. All Rights Reserved.
        </span>
      </div>
    </div>
  );
}

export default PdfFooter;
