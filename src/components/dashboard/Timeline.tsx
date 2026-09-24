import { TimelineChart } from "../charts/TimelineChart";
import type { TimelineData } from "../../types/report";

interface TimelineProps {
  data: TimelineData;
  domain: string;
}

export function Timeline({ data, domain }: TimelineProps) {
  const currentYear = String(new Date().getFullYear());

  const currentYearPoint = data.points.find(
    (point) => point.year === currentYear,
  );

  const currentYearCompromises = currentYearPoint
    ? currentYearPoint.users + currentYearPoint.employees
    : 0;

  const currentYearSummary =
    currentYearCompromises > 0
      ? `${currentYearCompromises} new compromise${
          currentYearCompromises === 1 ? "" : "s"
        } ${
          currentYearCompromises === 1 ? "has" : "have"
        } already been identified in ${currentYear}.`
      : null;

  return (
    <section className="wrap" id="timeline">
      <p className="eyebrow"></p>

      <h2 className="section-title">
        A persistent exposure, not a one-off incident
      </h2>

      <p className="section-sub">
        Yearly trend of compromised users and employees associated with{" "}
        <strong>{domain}</strong>, highlighting persistent exposure over time.
        {currentYearSummary && ` ${currentYearSummary}`}
      </p>

      <div className="timeline-box">
        <div className="chart-legend">
          <span>
            <span
              className="dot"
              style={{
                background: "var(--light-purple-Styx, #6740B4)",
              }}
            />
            Users
          </span>

          <span>
            <span
              className="dot"
              style={{
                background: "var(--light-pink-Styx, #EA447B)",
              }}
            />
            Employees
          </span>
        </div>

        <TimelineChart data={data.points} />
      </div>
    </section>
  );
}
