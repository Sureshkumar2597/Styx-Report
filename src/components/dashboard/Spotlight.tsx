// src/components/dashboard/Spotlight.tsx
import { useCallback, useState } from "react";
import { CountUp } from "../charts/CountUp";
import { Badge } from "../common/Badge";
import { Table, type TableColumn } from "../common/Table";
import { LockGate } from "../common/LockGate";
import type { SpotlightData, UrlRow } from "../../types/report";
import { useReveal } from "../../context/RevealContext";

interface SpotlightProps {
  data: SpotlightData;
  domain: string;
  isPdf?: boolean;
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

export function Spotlight({ data, domain, isPdf = false }: SpotlightProps) {
  const [urlRows, setUrlRows] = useState<UrlRow[]>(data.urlRows);
  const [sortDir, setSortDir] = useState<Record<number, boolean>>({});
  const { isRevealed } = useReveal();

  const sortTable = useCallback((colIndex: number) => {
    setSortDir((prev) => {
      const next = { ...prev, [colIndex]: !prev[colIndex] };
      const dir = next[colIndex] ? 1 : -1;

      setUrlRows((rows) => {
        const copy = [...rows];

        copy.sort((a, b) => {
          const aVal =
            colIndex === 0
              ? a.url.toLowerCase()
              : colIndex === 1
                ? a.scope.toLowerCase()
                : a.occurrences;

          const bVal =
            colIndex === 0
              ? b.url.toLowerCase()
              : colIndex === 1
                ? b.scope.toLowerCase()
                : b.occurrences;

          if (aVal < bVal) return -1 * dir;
          if (aVal > bVal) return 1 * dir;

          return 0;
        });

        return copy;
      });

      return next;
    });
  }, []);

  const columns: TableColumn<UrlRow>[] = [
    {
      key: "url",
      header: "Compromised URL",
      sortable: true,
      cellClassName: "url",
      render: (row) =>
        isRevealed ? (
          <a
            href={row.url}
            target="_blank"
            rel="noreferrer"
            className="spot-url"
          >
            {row.url}
          </a>
        ) : (
          <button
            type="button"
            className="spot-url-mask"
            onClick={scrollToUnlock}
          >
            <span className="sensitive">https://portal.company.com/login</span>
          </button>
        ),
    },
    {
      key: "scope",
      header: "Scope",
      sortable: true,
      render: (row) => row.scope,
    },
    {
      key: "occurrences",
      header: "Occurrences",
      sortable: true,
      cellClassName: "num",
      render: (row) => row.occurrences,
    },
  ];

  return (
    <section className="wrap" id="spotlight">
      <h2 className="section-title">
        Active infostealer activity found targeting your domain's login portals
      </h2>

      <div className="spot-box">
        <div className="spot-head">
          <p
            className="spot-title"
            dangerouslySetInnerHTML={{ __html: data.title }}
          />
          <Badge className="badge badge-active">{data.badgeLabel}</Badge>
        </div>

        <p
          className="spot-meta"
          dangerouslySetInnerHTML={{ __html: data.meta }}
        />

        <div className="mini-stats">
          {data.stats.map((s) => (
            <div className="mini-stat" key={s.label}>
              <CountUp
                target={s.target}
                suffix={s.suffix}
                className="mini-stat-num"
              />
              <div className="mini-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {!isRevealed && !isPdf && <LockGate domain={domain} />}

        <Table
          columns={columns}
          rows={urlRows}
          rowKey={(row) => row.url}
          onSort={sortTable}
          initialRows={8}
          loadMoreStep={5}
        />
        <p
          className="foot-note"
          dangerouslySetInnerHTML={{
            __html: data.footNote,
          }}
        />
      </div>
    </section>
  );
}
