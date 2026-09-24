import { useEffect } from "react";
import { CountUp } from "../charts/CountUp";
import type { HeroData } from "../../types/report";

interface HeroProps {
  data: HeroData;
  domain: string;
}

export function Hero({ data, domain }: HeroProps) {
  const companyName = data.companyTitle
    ? data.companyTitle
        .split(".")[0] // seaspan.com -> seaspan
        .replace(/[-_]/g, " ") // my-company -> my company
        .replace(/\b\w/g, (c) => c.toUpperCase()) // Seaspan
    : "";

  useEffect(() => {
    document.title = companyName
      ? `${companyName} — External Cyber Risk Assessment | Styx Intelligence`
      : "External Cyber Risk Assessment | Styx Intelligence";
  }, [companyName]);

  return (
    <header className="hero" id="overview">
      <div className="wrap hero-inner">
        <div className="live-badge">
          <span className="live-dot"></span> {data.badgeText}
        </div>

        <div className="eyebrow">{data.eyebrow}</div>

        <div className="hero-grid">
          <div>
            {/* Banner title */}
            <h1 className="hero-title">{companyName}</h1>

            <div className="hero-meta">
              {data.metaIndustry} &nbsp;·&nbsp;
              <strong>{data.metaDate}</strong>
              &nbsp;·&nbsp; Target: {data.metaTarget}
            </div>

            <p
              className="hero-desc"
              dangerouslySetInnerHTML={{ __html: data.description }}
            />
          </div>

          <div className="hero-stat">
            <CountUp
              target={data.statTarget}
              suffix={data.statSuffix}
              className="hero-stat-num"
            />
            <div className="hero-stat-label">{data.statLabel}</div>
          </div>
        </div>

        <p className="preview-strip">
          Free instant preview generated from public infostealer intelligence
          for <strong>{domain}</strong>. Scroll to view risk report preview and
          unlock full report.
        </p>
      </div>
    </header>
  );
}

export default Hero;
