import React from "react";
import { Button } from "../common/Button";
import "./FullAssessment.css";
import { usePdfMode } from "../../context/PdfModeContext";

interface RiskCategory {
  label: string;
  pct: number;
}

interface KeyRiskIndicator {
  name: string;
  value: string;
}

interface UnlockCategory {
  title: string;
  description: string;
}

/* -------- Illustrative teaser dashboard data --------
   These mirror the sample figures shown in the source HTML teaser
   (not computed from live data — the real dashboard is unlocked
   after the full report is requested). */
const RISK_CATEGORIES: RiskCategory[] = [
  { label: "Application security", pct: 6 },
  { label: "Asset reputation", pct: 12 },
  { label: "Brand risks", pct: 6 },
  { label: "Certificates", pct: 12 },
  { label: "DNS Health", pct: 6 },
  { label: "Data leakage", pct: 12 },
  { label: "Disclosures", pct: 0 },
  { label: "Network security", pct: 23 },
  { label: "Patching cadence", pct: 23 },
];

const KEY_RISK_INDICATORS: KeyRiskIndicator[] = [
  { name: "Server vulnerabilities (Critical)", value: "+20.4%" },
  { name: "Exposed cloud storage", value: "+13.6%" },
  { name: "FTP service observed (21)", value: "+13.6%" },
  { name: "Malware blocklist", value: "+13.6%" },
  { name: "Server vulnerabilities (High)", value: "+13.6%" },
];

const UNLOCK_CATEGORIES: UnlockCategory[] = [
  {
    title: "Brand Risk",
    description:
      "Domain impersonation, account impersonation, and phishing campaigns targeting your brand.",
  },
  {
    title: "Your Attack Surface & Exposure",
    description:
      "Every internet-facing asset tied to seaspan.com, mapped and continuously monitored.",
  },
  {
    title: "Email & DNS Hygiene",
    description:
      "SPF, DKIM, DMARC and DNS configuration weaknesses attackers can exploit to spoof your domain.",
  },
  {
    title: "TLS/SSL Certificate Health",
    description:
      "Expired, misconfigured, or weak certificates across your infrastructure.",
  },
];

const MORE_TAGS: string[] = [
  "Malware & Exploit IP Blocklist Status",
  "Asset Vulnerabilities",
  "Active Phishing Campaigns",
  "Exposed Cloud Storage & Secrets",
  "+ many more",
];

const COMPANY_NAME = "Seaspan";

function scrollToUnlock(): void {
  document.getElementById("unlock")?.scrollIntoView({ behavior: "smooth" });
}

export function FullAssessment(): JSX.Element {
  const isPdf = usePdfMode();
  return (
    <section id="locked" className="fa-section">
      <div className="fa-wrap">
        <div className="fa-panel-head">
          <div>
            {/* <div className="fa-eyebrow">Included in the full assessment</div> */}
            <h2 className="fa-section-title">Unlock the Full Report</h2>
          </div>
          <div
            className="fa-click-hint"
            role="button"
            tabIndex={0}
            onClick={scrollToUnlock}
          >
            Click the preview, or unlock below ↓
          </div>
        </div>

        <div
          className="fa-teaser-wrap"
          role="button"
          tabIndex={0}
          onClick={scrollToUnlock}
        >
          <div className={`fa-teaser-dashboard ${isPdf ? "fa-pdf-mode" : ""}`}>
            <div className="fa-teaser-panel fa-gauge-box">
              <h5>Digital Risk Score</h5>
              <svg
                width="190"
                height="105"
                viewBox="0 0 200 110"
                className="fa-gauge-svg"
              >
                <path
                  d="M10,100 A90,90 0 0 1 36.36,36.36"
                  stroke="#3fd0c9"
                  strokeWidth={16}
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M36.36,36.36 A90,90 0 0 1 100,10"
                  stroke="#f0c93b"
                  strokeWidth={16}
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M100,10 A90,90 0 0 1 163.64,36.36"
                  stroke="#f5a623"
                  strokeWidth={16}
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M163.64,36.36 A90,90 0 0 1 190,100"
                  stroke="#ef5b5b"
                  strokeWidth={16}
                  fill="none"
                  strokeLinecap="round"
                />
                <line
                  x1="100"
                  y1="100"
                  x2="150"
                  y2="45"
                  stroke="#fff"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="5" fill="#fff" />
              </svg>
              <div className="fa-gauge-score">
                736<span>/1000</span>
              </div>
              <div className="fa-gauge-avg">
                Industry Average Score
                <br />
                168/1000
              </div>
            </div>

            <div className="fa-teaser-panel">
              <h5>Risk Categories</h5>
              <div className="fa-teaser-categories">
                {RISK_CATEGORIES.map((category) => (
                  <div className="fa-cat-row" key={category.label}>
                    <div className="fa-cat-top">
                      <span>{category.label}</span>
                      <span>{category.pct}%</span>
                    </div>
                    <div className="fa-cat-track">
                      <div
                        className="fa-cat-fill"
                        style={{ width: `${Math.max(category.pct, 3)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="fa-teaser-panel">
              <h5>Key Risk Indicators</h5>
              <div className="fa-kri-head">
                <span>Risk</span>
                <span>Score impact</span>
              </div>
              <div className="fa-teaser-kri">
                {KEY_RISK_INDICATORS.map((kri) => (
                  <div className="fa-kri-row" key={kri.name}>
                    <span className="fa-krname">{kri.name}</span>
                    <span className="fa-krval">{kri.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="fa-teaser-overlay">
            <div className="fa-lock-icon">🔒</div>
            <div className="fa-teaser-title">
              This is a preview of {COMPANY_NAME}&apos;s full Digital Risk Score
              dashboard
            </div>
            <div className="fa-teaser-sub">
              Risk category breakdown, key risk indicators, and a 0–1000 score
              benchmarked against your industry — unlocked with the full report.
            </div>
            <Button
              className="fa-unlock-btn"
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                scrollToUnlock();
              }}
            >
              Unlock Full Report
            </Button>
          </div>
        </div>

        <div className="fa-teaser-caption">
          Sample dashboard shown for illustration — {COMPANY_NAME}&apos;s actual
          Digital Risk Score is calculated the moment the full report is
          unlocked.
        </div>

        <div className="fa-unlock-categories">
          <ol className="fa-unlock-list">
            {UNLOCK_CATEGORIES.map((category) => (
              <li key={category.title}>
                <b>{category.title}</b> — {category.description}
              </li>
            ))}
          </ol>
          <div className="fa-more-tags">
            {MORE_TAGS.map((tag) => (
              <span className="fa-more-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FullAssessment;
