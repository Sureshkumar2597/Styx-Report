import { DonutChart } from "../charts/DonutChart";
import { Panel } from "../common/Panel";
import type { PasswordDonut, HygieneData } from "../../types/report";

interface PasswordStrengthProps {
  employees: PasswordDonut;
  users: PasswordDonut;
  hygiene: HygieneData;
}

export function PasswordStrength({
  employees,
  users,
  hygiene,
}: PasswordStrengthProps) {
  return (
    <section className="wrap" id="password-strength">
      <p className="eyebrow">Credential &amp; device hygiene</p>
      <h2 className="section-title">Where the weak points sit</h2>
      <div className="two-col" style={{ marginBottom: 16 }}>
        <Panel label={employees.title}>
          <DonutChart
            id="donutEmp"
            segments={employees.segments}
            breakdown={employees.breakdown}
          />
        </Panel>
        <Panel label={users.title}>
          <DonutChart
            id="donutUsr"
            segments={users.segments}
            breakdown={users.breakdown}
          />
        </Panel>
      </div>
      <Panel label="Employee Device Hygiene">
        <div className="two-col">
          <div>
            <p
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: "var(--text)",
                margin: "0 0 8px 0",
              }}
            >
              Anti-Virus Status
            </p>
            <div className="hygiene-bar">
              {hygiene.avSegments.map((seg) => (
                <div
                  className="hygiene-seg"
                  key={seg.name}
                  style={{ width: `${seg.pct}%`, background: seg.color }}
                >
                  {seg.name} {seg.pct}%
                </div>
              ))}
            </div>
            <div className="hygiene-legend">
              {hygiene.avSegments.map((seg) => (
                <span key={seg.name}>
                  <span
                    className="dot"
                    style={{ background: seg.color }}
                  ></span>
                  {seg.name} AV — {seg.pct}%
                </span>
              ))}
              <span>
                <span
                  className="dot"
                  style={{ background: "var(--border)" }}
                ></span>
                No AV — 0%
              </span>
            </div>
          </div>
          <div>
            <p
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: "var(--text)",
                margin: "0 0 8px 0",
              }}
            >
              Infected Sensitive Application
            </p>
            <p
              className="app-note"
              dangerouslySetInnerHTML={{ __html: hygiene.appNote }}
            />
          </div>
        </div>
      </Panel>
    </section>
  );
}
