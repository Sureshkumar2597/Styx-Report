import { useNavigate } from "react-router-dom";
import { useThemeContext } from "../../context/ThemeContext";
import "./ThankYouPage.css";

export type DeliveryStatus = "uploading" | "success" | "error";

interface ThankYouPageProps {
  email: string;
  status: DeliveryStatus;
  onRetry?: () => void;
}

function ReportIcon({ status }: { status: DeliveryStatus }) {
  return (
    <div className="typ-icon-wrap">
      <span className="typ-glow" aria-hidden="true" />

      <div className="typ-float">
        <svg viewBox="0 0 160 120" className="typ-icon-svg" aria-hidden="true">
          {/* laptop base */}
          <rect
            x="30"
            y="18"
            width="100"
            height="62"
            rx="6"
            className="typ-laptop-screen"
          />
          <rect
            x="38"
            y="26"
            width="84"
            height="46"
            rx="3"
            className="typ-laptop-inner"
          />
          <path
            d="M14 90 L146 90 L134 100 L26 100 Z"
            className="typ-laptop-base"
          />

          {/* on-screen document lines, drawn in one by one */}
          <rect
            x="48"
            y="36"
            width="44"
            height="4"
            rx="2"
            className="typ-doc-line typ-doc-line-1"
          />
          <rect
            x="48"
            y="46"
            width="60"
            height="4"
            rx="2"
            className="typ-doc-line typ-doc-line-2"
          />
          <rect
            x="48"
            y="56"
            width="36"
            height="4"
            rx="2"
            className="typ-doc-line typ-doc-line-3"
          />
        </svg>

        <div
          className={`typ-badge ${
            status === "error"
              ? "typ-badge-error"
              : status === "uploading"
                ? "typ-badge-uploading"
                : "typ-badge-success"
          }`}
        >
          {status === "error" ? (
            <svg
              viewBox="0 0 24 24"
              className="typ-badge-svg"
              aria-hidden="true"
            >
              <line
                x1="12"
                y1="7"
                x2="12"
                y2="13"
                className="typ-badge-stroke"
              />
              <circle cx="12" cy="17" r="1" className="typ-badge-dot" />
            </svg>
          ) : status === "uploading" ? (
            <span className="typ-badge-spinner" aria-hidden="true" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="typ-badge-svg"
              aria-hidden="true"
            >
              <path d="M5 12l4 4 10-10" className="typ-badge-check" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

export function ThankYouPage({ email, status, onRetry }: ThankYouPageProps) {
  const navigate = useNavigate();

  const handleVisitHome = () => {
    window.location.href = "https://styxintel.com/";
  };
  const { theme } = useThemeContext();

  const subtext =
    status === "success"
      ? "Thank you for your interest. Your risk report has been delivered to the email address you provided. Please check your inbox (and spam folder if needed) to access and download it."
      : status === "error"
        ? "Something went wrong while sending your report. Please try again, or head back to the homepage."
        : "Hang tight — we're generating your risk report and will deliver it to your inbox in just a moment.";

  const headingLead =
    status === "uploading" ? "Sending Report to" : "Report sent to";

  return (
    // data-theme is set here explicitly (in addition to the app-wide
    // attribute on <html>) so this page's styling is never ambiguous or
    // dependent on inheritance/media-query cascade order.
    <section className="typ-wrap" data-theme={theme}>
      <div className="typ-content">
        <ReportIcon status={status} />

        {/* Fixed two-line heading, matching the design:
            Line 1 — "Sending Report to {email}" / "Report sent to {email}"
            Line 2 — "successfully" / "..." / error copy */}
        <h1 className="typ-heading">
          {status === "error" ? (
            "We couldn't deliver your report"
          ) : (
            <>
              <span className="typ-heading-line">
                {headingLead}{" "}
                <span className="typ-email-highlight">{email}</span>
              </span>
              <span className="typ-heading-line">
                {status === "success" ? "successfully" : "..."}
              </span>
            </>
          )}
        </h1>

        <p className="typ-subtext">{subtext}</p>

        <div className="typ-actions">
          {status === "error" && onRetry && (
            <button
              type="button"
              className="typ-btn typ-btn-secondary"
              onClick={onRetry}
            >
              Retry
            </button>
          )}
          <button
            type="button"
            className="typ-btn typ-btn-primary"
            onClick={handleVisitHome}
            disabled={status === "uploading"}
          >
            Visit Home
          </button>
        </div>
      </div>
    </section>
  );
}
