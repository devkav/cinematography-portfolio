import "./column-chart.css";

import type { RankedItem } from "../RankedList/RankedList";

interface Props {
  title: string;
  items: RankedItem[];
}

const MAX_COLUMNS = 5;

export default function ColumnChart({ title, items }: Props) {
  const columns = items.slice(0, MAX_COLUMNS);
  const otherTotal = items.slice(MAX_COLUMNS).reduce((sum, item) => sum + item.value, 0);

  if (otherTotal) columns.push({ label: "Other", value: otherTotal });

  const max = Math.max(...columns.map((column) => column.value), 1);

  return (
    <div className="analytics-card column-chart">
      <p className="analytics-card-title">{title}</p>
      {columns.length === 0 ? (
        <p className="analytics-empty">No data for this period</p>
      ) : (
        <div role="img" aria-label={`${title} by visits`}>
          <div className="column-chart-row column-chart-plot">
            {columns.map((column) => (
              <div className="column-chart-column" key={column.label}>
                <p className="column-chart-value">{column.value.toLocaleString()}</p>
                <div
                  className={`column-chart-bar${column.label === "Other" ? " other" : ""}`}
                  style={{ height: `${(column.value / max) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="column-chart-row">
            {columns.map((column) => (
              <p className="column-chart-label" key={column.label} title={column.label}>
                {column.label}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
