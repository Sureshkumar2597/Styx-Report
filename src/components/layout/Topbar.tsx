import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "../theme/ThemeToggle";
import { useTheme } from "../../hooks/useTheme";
import type { NavLink } from "../../types/report";

interface TopbarProps {
  navLinks: NavLink[];
  activeSection: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onNavLinkClick: () => void;
  reportUnlocked: boolean;
  onUnlockClick: () => void;
}

const WHITE_LOGO =
  "https://riskreport.styxintel.com/wp-content/uploads/2023/03/Styx-logo-1.png";

const DARK_LOGO =
  "https://riskreport.styxintel.com/wp-content/uploads/2026/06/image-15.svg";

export function Topbar({
  navLinks,
  activeSection,
  menuOpen,
  onToggleMenu,
  onNavLinkClick,
  reportUnlocked,
  onUnlockClick,
}: TopbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logo =
    theme === "dark" ? WHITE_LOGO : isScrolled ? DARK_LOGO : WHITE_LOGO;

  const visibleNavLinks = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "findings", label: "Findings" },
      { id: "timeline", label: "Timeline" },
      { id: "families", label: "Third Party" },
    ],
    [],
  );

  return (
    <header className={`topbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="topbar-inner">
        <a
          href="https://styxintel.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="logo"
          aria-label="Styx Intelligence"
        >
          <img
            src={logo}
            alt="Styx Intelligence"
            className="logo-image"
            draggable={false}
          />
        </a>

        <nav className={`navlinks${menuOpen ? " open" : ""}`} id="navlinks">
          {visibleNavLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={activeSection === link.id ? "active" : ""}
              onClick={onNavLinkClick}
            >
              {link.label}
            </a>
          ))}

          <button
            className={`top-cta mobile-cta${reportUnlocked ? " done" : ""}`}
            onClick={() => {
              if (!reportUnlocked) {
                onUnlockClick();
              }
              onNavLinkClick();
            }}
          >
            {reportUnlocked ? "Report Unlocked ✓" : "Unlock Full Report"}
          </button>
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ThemeToggle />

          <button
            className={`top-cta desktop-cta${reportUnlocked ? " done" : ""}`}
            onClick={reportUnlocked ? undefined : onUnlockClick}
          >
            {reportUnlocked ? "Report Unlocked ✓" : "Unlock Full Report"}
          </button>

          <button
            className="menu-btn"
            aria-label="Toggle menu"
            onClick={onToggleMenu}
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
