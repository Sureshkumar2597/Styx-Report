import React, { useState, useCallback } from "react";
import { ErrorWave } from "./ErrorWave";
import { useTheme } from "../../../hooks/useTheme";
import "./ErrorPage.css";

export type ErrorType =
  | "river_current"
  | "invalid_domain"
  | "no_data"
  | "offline"
  | "timeout"
  | "api_error";

export interface ErrorPageProps {
  initialType?: ErrorType;
  onRetry?: () => void;
  onScanAnother?: (domain?: string) => void;
}

export function ErrorPage({
  initialType = "no_data",
  onRetry,
}: ErrorPageProps) {
  const [currentType] = useState<ErrorType>(initialType);
  const { theme } = useTheme();

  const [isTravelling, setIsTravelling] = useState(false);
  const [btnText, setBtnText] = useState("Try again");
  const [isBtnDisabled, setIsBtnDisabled] = useState(false);
  const [statusTagText, setStatusTagText] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRetryClick = () => {
    setIsBtnDisabled(true);
    setBtnText("Checking the current…");
    setIsTravelling(true);
  };

  const handleAnimationComplete = useCallback(() => {
    setIsTravelling(false);
    if (navigator.onLine) {
      setStatusTagText("RECONNECTED");
      setIsSuccess(true);
      setBtnText("Reloading…");
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } else {
      setIsBtnDisabled(false);
      setBtnText("Try again");
      setStatusTagText("STILL_NO_SIGNAL");
      setTimeout(() => {
        setStatusTagText(null);
      }, 2200);
    }
  }, []);

  const handleRetryAction = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className={`error-page-root error-layout ${
        theme === "dark" ? "error-theme-dark" : "error-theme-light"
      }`}
    >
      <main className="error-main">
        <div className="error-card" key={currentType}>
          {currentType === "river_current" && (
            <>
              <div className="eyebrow">Styx Threat Report</div>

              <ErrorWave
                isTravelling={isTravelling}
                onAnimationComplete={handleAnimationComplete}
              />

              <h1 className="headline">
                The crossing took longer than it should.
              </h1>
              <p className="description">
                Nothing's wrong on your end — the request just didn't make it
                back in time. One more try usually does it.
              </p>

              <div className="status-row">
                <span className={`status-tag ${isSuccess ? "is-ok" : ""}`}>
                  {statusTagText ?? "REQUEST_TIMED_OUT"}
                </span>
                <button
                  className="btn btn-primary"
                  onClick={handleRetryClick}
                  disabled={isBtnDisabled}
                >
                  {btnText}
                </button>
              </div>

              <div className="divider" />

              <p
                className="description"
                style={{ fontSize: "14px", marginBottom: "12px" }}
              >
                Would rather wait it out?
              </p>

              {!isSubmitted ? (
                <form
                  className="email-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (email) setIsSubmitted(true);
                  }}
                >
                  <input
                    type="email"
                    placeholder="you@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit">Notify me</button>
                </form>
              ) : (
                <p style={{ color: "var(--styx-blue)", fontSize: "14px" }}>
                  ✓ You're on the list — we'll email the report when cleared.
                </p>
              )}
            </>
          )}

          {currentType === "invalid_domain" && (
            <>
              <div className="illustration-wrap invalid-domain-anim">
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    className="globe-ring"
                    cx="10.5"
                    cy="10.5"
                    r="7.5"
                    stroke="var(--styx-blue)"
                  />
                  <path
                    className="globe-lat"
                    d="M3 10.5h15M10.5 3a10 10 0 0 1 3 7.5 10 10 0 0 1-3 7.5 10 10 0 0 1-3-7.5z"
                    stroke="var(--styx-blue)"
                    opacity="0.65"
                  />
                  <path
                    className="search-stem"
                    d="m16 16 5 5"
                    stroke="var(--styx-blue)"
                    strokeWidth="1.5"
                  />
                  <line
                    className="cross-line1"
                    x1="8"
                    y1="8"
                    x2="13"
                    y2="13"
                    stroke="var(--styx-orange)"
                    strokeWidth="1.25"
                  />
                  <line
                    className="cross-line2"
                    x1="13"
                    y1="8"
                    x2="8"
                    y2="13"
                    stroke="var(--styx-orange)"
                    strokeWidth="1.25"
                  />
                </svg>
              </div>
              <h1 className="headline">We couldn't find a valid domain</h1>
              <p className="description">
                Please enter a valid website domain to generate a security
                report. Enter domains like example.com and try again.
              </p>
              <div className="info-card">
                <div className="info-card-title">Accepted Formats</div>
                <div className="format-grid">
                  <ul className="format-list valid">
                    <li>✓ google.com</li>
                    <li>✓ microsoft.com</li>
                  </ul>
                  <ul className="format-list invalid">
                    <li>✕ https://google.com</li>
                    <li>✕ www.google.com/page</li>
                  </ul>
                </div>
              </div>
              <div className="action-group">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    window.location.href = "https://styxintel.com/styx-report/";
                  }}
                >
                  Try Another Domain
                </button>
              </div>
            </>
          )}

          {currentType === "no_data" && (
            <div className="no-data-container">
              <div className="illustration-wrap no-data-figma-anim">
                <svg
                  width="128"
                  height="128"
                  viewBox="0 0 120 128"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="shieldGradDark"
                      x1="60"
                      y1="4"
                      x2="60"
                      y2="116"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#0B2B5B" />
                      <stop offset="50%" stopColor="#081E42" />
                      <stop offset="100%" stopColor="#040F2A" />
                    </linearGradient>

                    <linearGradient
                      id="shieldBorderGrad"
                      x1="20"
                      y1="4"
                      x2="100"
                      y2="116"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#2997F6" />
                      <stop offset="100%" stopColor="#0D4B8B" />
                    </linearGradient>

                    <linearGradient
                      id="checkGrad"
                      x1="42"
                      y1="48"
                      x2="78"
                      y2="82"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#FFB326" />
                      <stop offset="100%" stopColor="#FF8F00" />
                    </linearGradient>

                    <filter
                      id="shieldShadow"
                      x="0"
                      y="0"
                      width="120"
                      height="128"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feDropShadow
                        dx="0"
                        dy="8"
                        stdDeviation="12"
                        floodColor="#081E42"
                        floodOpacity="0.35"
                      />
                    </filter>
                  </defs>

                  <g filter="url(#shieldShadow)">
                    <path
                      d="M60 6L102 24C102 68 84 102 60 114C36 102 18 68 18 24L60 6Z"
                      fill="url(#shieldGradDark)"
                      stroke="url(#shieldBorderGrad)"
                      strokeWidth="3"
                      strokeLinejoin="round"
                    />
                  </g>

                  <path
                    d="M60 12L96 28C96 66 80 97 60 107C40 97 24 66 24 28L60 12Z"
                    fill="none"
                    stroke="#2997F6"
                    strokeOpacity="0.25"
                    strokeWidth="1.5"
                  />

                  <path
                    className="figma-check-tick"
                    d="M42 58L54 72L78 46"
                    stroke="url(#checkGrad)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1 className="headline figma-headline">
                No Known Compromises Found
              </h1>
              <p className="description figma-subhead">
                Good news—we didn't find any known compromised credentials or
                breach data for this domain in our current intelligence sources.
                Continue monitoring to stay protected.
              </p>

              <div className="figma-wait-section">
                <p className="figma-wait-label">
                  Would you like to try another domain?
                </p>

                <div className="action-group">
                  <button
                    type="button"
                    className="btn btn-primary figma-submit-btn"
                    onClick={() => {
                      window.location.href =
                        "https://styxintel.com/styx-report/";
                    }}
                  >
                    Try Another Domain
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentType === "offline" && (
            <>
              <div className="illustration-wrap offline-anim">
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    className="wifi-arc arc-3"
                    d="M1.42 9a16 16 0 0 1 21.16 0"
                    stroke="var(--text-main)"
                  />
                  <path
                    className="wifi-arc arc-2"
                    d="M5 12.55a11 11 0 0 1 14.08 0"
                    stroke="var(--text-main)"
                  />
                  <path
                    className="wifi-arc arc-1"
                    d="M8.53 16.11a6 6 0 0 1 6.95 0"
                    stroke="var(--text-main)"
                  />
                  <circle
                    className="wifi-dot"
                    cx="12"
                    cy="20"
                    r="1"
                    stroke="var(--styx-blue)"
                    fill="var(--styx-blue)"
                  />
                  <line
                    className="broken-slash"
                    x1="2"
                    y1="2"
                    x2="22"
                    y2="22"
                    stroke="var(--styx-blue)"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <h1 className="headline">No Internet Connection</h1>
              <p className="description">
                Please check your internet connection and try again.
              </p>
              <div className="action-group">
                <button className="btn btn-primary" onClick={handleRetryAction}>
                  Retry
                </button>
              </div>
            </>
          )}

          {currentType === "timeout" && (
            <>
              <div className="illustration-wrap timeout-anim">
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="2"
                    y="3"
                    width="20"
                    height="7"
                    rx="2"
                    stroke="var(--text-main)"
                  />
                  <rect
                    x="2"
                    y="14"
                    width="20"
                    height="7"
                    rx="2"
                    stroke="var(--text-main)"
                  />
                  <line
                    className="led-blink led-1"
                    x1="5.5"
                    y1="6.5"
                    x2="5.51"
                    y2="6.5"
                    stroke="var(--styx-blue)"
                    strokeWidth="2"
                  />
                  <line
                    className="led-blink led-2"
                    x1="5.5"
                    y1="17.5"
                    x2="5.51"
                    y2="17.5"
                    stroke="var(--styx-blue)"
                    strokeWidth="2"
                  />
                  <line
                    className="stream-ray ray-1"
                    x1="9"
                    y1="6.5"
                    x2="18.5"
                    y2="6.5"
                    stroke="var(--styx-blue)"
                    strokeWidth="1.25"
                  />
                  <line
                    className="stream-ray ray-2"
                    x1="9"
                    y1="17.5"
                    x2="18.5"
                    y2="17.5"
                    stroke="var(--styx-blue)"
                    strokeWidth="1.25"
                  />
                </svg>
              </div>
              <h1 className="headline">Service Temporarily Unavailable</h1>
              <p className="description">
                Our servers are taking longer than expected. Please try again
                shortly.
              </p>
              <div className="action-group">
                <button className="btn btn-primary" onClick={handleRetryAction}>
                  Retry
                </button>
              </div>
            </>
          )}

          {currentType === "api_error" && (
            <>
              <div className="illustration-wrap api-error-anim">
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    className="triangle-alert"
                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                    stroke="var(--styx-red)"
                  />
                  <line
                    className="alert-exclamation"
                    x1="12"
                    y1="9"
                    x2="12"
                    y2="13"
                    stroke="var(--styx-red)"
                    strokeWidth="1.5"
                  />
                  <line
                    className="alert-dot"
                    x1="12"
                    y1="17"
                    x2="12.01"
                    y2="17"
                    stroke="var(--styx-red)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h1 className="headline">Something Went Wrong</h1>
              <p className="description">
                An unexpected error occurred while generating the report.
              </p>
              <div className="action-group">
                <button className="btn btn-primary" onClick={handleRetryAction}>
                  Retry
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    window.location.href = "https://styxintel.com/contact-us/";
                  }}
                >
                  Contact Us
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="error-footer error-footer-centered">
        <div>Powered by Styx Intelligence</div>
      </footer>
    </div>
  );
}

export default ErrorPage;
