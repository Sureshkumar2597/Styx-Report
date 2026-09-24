import React from "react";

interface LockGateProps {
  domain: string;
  title?: string;
  description?: string;
}

function scrollToUnlock() {
  const target =
    document.getElementById("unlock-report") ??
    document.getElementById("unlock");

  if (target) {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

export function LockGate({
  domain,
  title = "Unlock Your Full Report to Reveal the Exact Compromised URLs",
  description,
}: LockGateProps) {
  return (
    <div className="spot-lockgate">
      <div className="spot-lockgate-left">
        <div className="spot-lockgate-heading">
          <span className="spot-lockgate-icon" aria-hidden="true">
            🔒
          </span>

          <p className="spot-lockgate-title">{title}</p>
        </div>

        <p className="spot-lockgate-sub">
          {description ?? (
            <>
              To help keep your organization safe, some information in this
              report is restricted. Unlock the full report to view the exact
              compromised URLs.
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        className="spot-lockgate-btn"
        onClick={scrollToUnlock}
      >
        Unlock Full Report
      </button>
    </div>
  );
}
