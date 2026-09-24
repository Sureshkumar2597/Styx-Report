import type { DonutSegment, PasswordBreakdownRow } from "../../types/report";

function buildDonutGradient(segments: DonutSegment[]): string {
  let acc = 0;
  const stops = segments
    .map(([color, pct]) => {
      const start = acc;
      acc += pct;
      return `${color} ${start}% ${acc}%`;
    })
    .join(", ");
  return `conic-gradient(${stops})`;
}

interface DonutChartProps {
  segments: DonutSegment[];
  breakdown: PasswordBreakdownRow[];
  id?: string;
}

/**
 * Renders a conic-gradient donut plus its legend rows. Used for both
 * the employee and user password-strength panels — pass different
 * segments/breakdown props for each.
 */
export function DonutChart({ segments, breakdown, id }: DonutChartProps) {
  const background = buildDonutGradient(segments);

  return (
    <div className="donut-row">
      <div className="donut" id={id} style={{ background }}></div>
      <div className="donut-legend">
        {breakdown.map((row) => (
          <div className="row" key={row.label}>
            <span className="name">
              <span className="dot" style={{ background: row.color }}></span>
              {row.label}
            </span>
            <span className="val">{row.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
