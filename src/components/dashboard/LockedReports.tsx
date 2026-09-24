import type { LockedReportsData } from "../../types/report";

interface LockedReportsProps {
  data: LockedReportsData;
  unlockedCards: boolean[];
  onCardClick: () => void;
}

export function LockedReports({
  data,
  unlockedCards,
  onCardClick,
}: LockedReportsProps) {
  return (
    <section className="wrap" id="classified">
      <div className="locked-head">
        <div>
          <p className="eyebrow">Included in the full assessment</p>
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            Six more categories, currently classified
          </h2>
        </div>
        <span className="locked-count">
          Click any card, or unlock all below ↓
        </span>
      </div>
      <div className="locked-grid" id="lockedGrid">
        {data.cards.map((card, i) => {
          const unlocked = unlockedCards[i];
          return (
            <div
              className={`locked-card${unlocked ? " unlocked" : ""}`}
              onClick={unlocked ? undefined : onCardClick}
              key={card.title}
            >
              <span className="stamp">UNLOCK</span>
              <p className="lc-title">{card.title}</p>
              <span className="lc-status">
                {unlocked ? "✓ Unlocked" : "🔒 Locked"}
              </span>
              <div className="redact-lines">
                {card.redactWidths.map((w, idx) => (
                  <div
                    className="redact-line"
                    key={idx}
                    style={{
                      width: `${w}%`,
                      transform: unlocked ? "scaleX(0)" : undefined,
                    }}
                  ></div>
                ))}
              </div>
              <p className="teaser-real">{card.teaser}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
