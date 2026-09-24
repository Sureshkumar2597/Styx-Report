// src/components/common/Table.tsx
import { useEffect, useState, type ReactNode } from "react";
import { usePdfMode } from "../../context/PdfModeContext";

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  cellClassName?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onSort?: (columnIndex: number) => void;
  initialRows?: number;
  loadMoreStep?: number;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  onSort,
  initialRows = 10,
  loadMoreStep = 10,
}: TableProps<T>) {
  const isPdf = usePdfMode();
  const [visibleCount, setVisibleCount] = useState(initialRows);

  // Reset visible rows whenever data changes (sorting/filtering/new API response)
  useEffect(() => {
    setVisibleCount(initialRows);
  }, [rows, initialRows]);

  // Web: paginated via "Load More" (visibleCount grows on click).
  // PDF: static snapshot — always capped at `initialRows`, regardless of
  // visibleCount state, and "Load More" never renders.
  const visibleRows = isPdf
    ? rows.slice(0, initialRows)
    : rows.slice(0, visibleCount);

  const hasMore = !isPdf && visibleCount < rows.length;

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  className={col.sortable ? "sortable" : undefined}
                  onClick={col.sortable && onSort ? () => onSort(i) : undefined}
                >
                  {col.header}
                  {col.sortable && <span className="arrow">⇅</span>}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key} className={col.cellClassName}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="table-load-more">
          <button
            className="load-more-btn"
            onClick={() =>
              setVisibleCount((prev) =>
                Math.min(prev + loadMoreStep, rows.length),
              )
            }
          >
            Load More ({rows.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </>
  );
}
