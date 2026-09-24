import styxLogo from "../../../src/assets/images/styx-white-logo.svg";

const STYX_LOGO_URL = styxLogo;

interface PdfHeaderBannerProps {
  title?: string;
}

export function PdfHeaderBanner({
  title = "External Cyber Risk Assessment",
}: PdfHeaderBannerProps) {
  return (
    <div className="pdf-header-banner" data-pdf-block>
      <span className="pdf-header-banner-title">{title}</span>
      <img
        className="pdf-header-banner-logo"
        src={STYX_LOGO_URL}
        alt="Styx Intelligence"
      />
    </div>
  );
}

export default PdfHeaderBanner;
