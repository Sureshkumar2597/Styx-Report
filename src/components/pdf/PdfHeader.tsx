import styxLogo from "../../../src/assets/images/styx-white-logo.svg";

const STYX_LOGO_URL = styxLogo;

export function PdfHeader() {
  return (
    <div className="pdf-header" data-pdf-block>
      <img
        className="pdf-header-logo"
        src={STYX_LOGO_URL}
        alt="Styx Intelligence"
      />
    </div>
  );
}

export default PdfHeader;
