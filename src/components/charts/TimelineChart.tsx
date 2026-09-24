import { useRef, useState } from "react";
import type { TimelinePoint } from "../../types/report";

interface TimelineChartProps {
  data: TimelinePoint[];
}

export function TimelineChart({ data }: TimelineChartProps) {
  const holderRef = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  const W = 1000;
  const H = 300;

  const padL = 50;
  const padR = 20;
  const padT = 20;
  const padB = 42;

  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  /**
   * Show only the latest 5 calendar years, including the current year.
   *
   * Example:
   * Current year = 2026
   * Allowed years = 2022, 2023, 2024, 2025, 2026
   *
   * Any API data outside this range (e.g. 1970, 2020, 2021)
   * will be ignored by the frontend.
   */
  const currentYear = new Date().getFullYear();
  const firstAllowedYear = currentYear - 4;

  const filteredData = data
    .filter((d) => {
      const year = Number(d.year);

      return (
        Number.isFinite(year) && year >= firstAllowedYear && year <= currentYear
      );
    })
    .sort((a, b) => Number(a.year) - Number(b.year));

  const highestValue = Math.max(
    0,
    ...filteredData.map((d) => Math.max(d.users, d.employees)),
  );

  const maxVal = highestValue > 0 ? highestValue * 1.15 : 10;

  const hasData = filteredData.some((d) => d.users > 0 || d.employees > 0);

  const groupW =
    filteredData.length > 0 ? chartW / filteredData.length : chartW;

  const barW = groupW * 0.28;

  const gridSteps = 4;

  const showTip = (e: React.MouseEvent, text: string) => {
    if (!hasData) return;

    const rect = holderRef.current?.getBoundingClientRect();

    if (!rect) return;

    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text,
    });
  };

  const hideTip = () => setTooltip(null);

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <div className="chart-holder" ref={holderRef}>
      <svg
        id="timelineChart"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        {hasData ? (
          <>
            {/* Grid */}

            {Array.from({ length: gridSteps + 1 }).map((_, i) => {
              const y = padT + chartH - (chartH * i) / gridSteps;

              const value = Math.round((maxVal * i) / gridSteps);

              return (
                <g key={i}>
                  <line
                    x1={padL}
                    x2={W - padR}
                    y1={y}
                    y2={y}
                    stroke="var(--timeline-grid)"
                    strokeWidth="1"
                  />

                  <text
                    x={padL - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--timeline-axis)"
                    fontFamily="Inter, sans-serif"
                    fontSize="10"
                    fontWeight="400"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {/* Timeline data */}

            {filteredData.map((d, i) => {
              const gx = padL + i * groupW;

              const usersHeight = (d.users / maxVal) * chartH;

              const employeeHeight = (d.employees / maxVal) * chartH;

              return (
                <g key={d.year}>
                  {/* USERS */}

                  <rect
                    className="tt-bar"
                    x={gx + groupW * 0.18}
                    y={padT + chartH - usersHeight}
                    width={barW}
                    height={usersHeight}
                    rx={2}
                    fill="var(--light-purple-Styx, #6740B4)"
                    onMouseMove={(e) =>
                      showTip(e, `${d.year} • Users: ${d.users}`)
                    }
                    onMouseLeave={hideTip}
                  />

                  {/* EMPLOYEES */}

                  <rect
                    className="tt-bar"
                    x={gx + groupW * 0.54}
                    y={padT + chartH - employeeHeight}
                    width={barW}
                    height={Math.max(employeeHeight, 2)}
                    rx={2}
                    fill="var(--light-pink-Styx, #EA447B)"
                    onMouseMove={(e) =>
                      showTip(e, `${d.year} • Employees: ${d.employees}`)
                    }
                    onMouseLeave={hideTip}
                  />

                  {/* USERS VALUE */}

                  <text
                    x={gx + groupW * 0.18 + barW / 2}
                    y={padT + chartH - usersHeight - 8}
                    textAnchor="middle"
                    fill={isDark ? "#FFFFFF" : "#364152"}
                    fontFamily="Inter, sans-serif"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {d.users}
                  </text>

                  {/* EMPLOYEES VALUE */}

                  <text
                    x={gx + groupW * 0.54 + barW / 2}
                    y={padT + chartH - employeeHeight - 8}
                    textAnchor="middle"
                    fill={isDark ? "#FFFFFF" : "#364152"}
                    fontFamily="Inter, sans-serif"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {d.employees}
                  </text>

                  {/* YEAR */}

                  <text
                    x={gx + groupW / 2}
                    y={H - 12}
                    textAnchor="middle"
                    fill="var(--timeline-axis)"
                    fontFamily="Inter, sans-serif"
                    fontSize="10"
                    fontWeight="400"
                    textTransform="uppercase"
                  >
                    {d.year}
                  </text>
                </g>
              );
            })}
          </>
        ) : (
          /* Subtle dashed grid so the card still reads as a chart */

          <g className="timeline-empty-grid" aria-hidden="true">
            {Array.from({
              length: gridSteps + 1,
            }).map((_, i) => {
              const y = padT + chartH - (chartH * i) / gridSteps;

              return (
                <line
                  key={i}
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  stroke="var(--timeline-grid)"
                  strokeWidth="1"
                />
              );
            })}
          </g>
        )}
      </svg>

      {!hasData && (
        <div
          className="timeline-empty"
          role="status"
          aria-live="polite"
          style={{
            top: `${(padT / H) * 100}%`,
            bottom: `${(padB / H) * 100}%`,
          }}
        >
          <div className="timeline-empty-content">
            <svg
              className="timeline-empty-icon"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 19V5M4 19H20M8 19V11M12 19V7M16 19V13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <p className="timeline-empty-title">No timeline data available</p>

            <p className="timeline-empty-description">
              No compromised users or employees were detected during the
              selected reporting period.
            </p>
          </div>
        </div>
      )}

      {hasData && (
        <div
          className="chart-tooltip"
          style={{
            left: tooltip ? tooltip.x : 0,
            top: tooltip ? tooltip.y : 0,
            opacity: tooltip ? 1 : 0,
          }}
        >
          {tooltip?.text}
        </div>
      )}
    </div>
  );
}
