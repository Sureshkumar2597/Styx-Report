import { useTheme } from "../../hooks/useTheme";

const WHITE_LOGO =
  "https://riskreport.styxintel.com/wp-content/uploads/2023/03/Styx-logo-1.png";

const DARK_LOGO =
  "https://riskreport.styxintel.com/wp-content/uploads/2026/06/image-15.svg";

export function Footer() {
  const { theme } = useTheme();

  // Dark theme -> White logo
  // Light theme -> Dark logo
  const logo = theme === "dark" ? WHITE_LOGO : DARK_LOGO;

  return (
    <footer className="wrap">
      <div className="footer-row">
        <div className="footer-left">
          <a
            href="https://styxintel.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-logo"
            aria-label="Styx Intelligence"
          >
            <img
              src={logo}
              alt="Styx Intelligence"
              className="footer-logo-image"
              draggable={false}
            />
          </a>
        </div>

        <div className="footer-right">
          <p>Private &amp; Confidential</p>
          <p>© 2026 Styx Intelligence. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
