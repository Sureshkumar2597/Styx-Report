// src/components/dashboard/Findings.tsx

import { useMemo, useState } from "react";
import { Badge } from "../common/Badge";
import { LockGate } from "../common/LockGate";
import type { FindingsData, Severity } from "../../types/report";
import { useReveal } from "../../context/RevealContext";
import { usePdfMode } from "../../context/PdfModeContext";

import CriticalIcon from "../../assets/images/Critical.svg";
import HighIcon from "../../assets/images/High.svg";
import MediumIcon from "../../assets/images/Medium.svg";
import LowIcon from "../../assets/images/Low.svg";

interface FindingsProps {
  data: FindingsData;
  domain: string;
}

const PREVIEW_COUNT = 3;
const PDF_MAX_ITEMS = 7;

const SEVERITY_ICONS: Partial<Record<Severity, string>> = {
  critical: CriticalIcon,
  high: HighIcon,
  medium: MediumIcon,
  low: LowIcon,
};

export function Findings({ data, domain }: FindingsProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | Severity>("all");
  const { isRevealed } = useReveal();
  const isPdf = usePdfMode();

  /*
   * Always show the complete severity filter set in this order:
   * All → Critical → High → Medium → Low
   *
   * The filter buttons remain visible even when there are no
   * findings for a particular severity.
   */
  const availableFilters = useMemo(
    () => [
      { key: "all" as const, label: "All" },
      { key: "critical" as Severity, label: "Critical" },
      { key: "high" as Severity, label: "High" },
      { key: "medium" as Severity, label: "Medium" },
      { key: "low" as Severity, label: "Low" },
    ],
    [],
  );

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") {
      return data.items;
    }

    return data.items.filter((item) => item.sev === activeFilter);
  }, [activeFilter, data.items]);

  // PDF: static snapshot, capped at PDF_MAX_ITEMS, no lock gate/hidden items.
  // Web: unchanged — preview count + reveal-gated hidden items as before.
  const visibleItems = isPdf
    ? filteredItems.slice(0, PDF_MAX_ITEMS)
    : isRevealed
      ? filteredItems
      : filteredItems.slice(0, PREVIEW_COUNT);

  const hiddenItems =
    isPdf || isRevealed ? [] : filteredItems.slice(PREVIEW_COUNT);

  const getEmptyLabel = () => {
    switch (activeFilter) {
      case "critical":
        return "No critical findings found.";
      case "high":
        return "No high findings found.";
      case "medium":
        return "No medium findings found.";
      case "low":
        return "No low findings found.";
      default:
        return "No findings found.";
    }
  };

  return (
    <section className="wrap" id="findings">
      <p className="eyebrow"></p>

      <h2 className="section-title">Ranked by severity</h2>

      {!isPdf && (
        <p className="section-sub">
          Filter to focus on what matters most right now.
        </p>
      )}

      <div className="filter-row" id="filterRow">
        {availableFilters.map((filter) => {
          const icon =
            filter.key !== "all" ? SEVERITY_ICONS[filter.key] : undefined;

          return (
            <button
              key={filter.key}
              type="button"
              className={`filter-btn${
                activeFilter === filter.key ? " active" : ""
              }`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.key !== "all" && icon && (
                <span className="filter-icon">
                  <img src={icon} alt="" aria-hidden="true" />
                </span>
              )}

              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      <div id="findingsList">
        {/* Empty state for a severity with no findings */}
        {filteredItems.length === 0 ? (
          <div className="finding finding-empty">
            <div>
              <p className="finding-title">{getEmptyLabel()}</p>

              <p className="finding-desc">
                There are currently no findings available for this severity.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Visible Findings */}
            {visibleItems.map((f, i) => (
              <div className="finding" data-sev={f.sev} key={`${f.sev}-${i}`}>
                <Badge
                  className={`sev-badge sev-${f.sev}${
                    isPdf ? " pdf-sev-badge" : ""
                  }`}
                >
                  {f.badge}
                </Badge>

                <div>
                  <p
                    className="finding-title"
                    dangerouslySetInnerHTML={{
                      __html: f.title,
                    }}
                  />

                  <p
                    className="finding-desc"
                    dangerouslySetInnerHTML={{
                      __html: f.desc,
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Single CTA — web only, never in PDF */}
            {!isPdf && !isRevealed && hiddenItems.length > 0 && (
              <LockGate
                domain={domain}
                title="Unlock Your Full Report to Reveal the Exact Compromised URLs"
              />
            )}

            {/* Hidden Findings — web only, never in PDF */}
            {!isPdf &&
              !isRevealed &&
              hiddenItems.map((f, i) => (
                <div
                  className="finding finding-locked"
                  data-sev={f.sev}
                  key={`locked-${f.sev}-${i}`}
                >
                  <Badge className={`sev-badge sev-${f.sev}`}>{f.badge}</Badge>

                  <div>
                    <p
                      className="finding-title"
                      dangerouslySetInnerHTML={{
                        __html: f.title,
                      }}
                    />

                    <p
                      className="finding-desc"
                      dangerouslySetInnerHTML={{
                        __html: f.desc,
                      }}
                    />
                  </div>
                </div>
              ))}
          </>
        )}
      </div>
    </section>
  );
}
