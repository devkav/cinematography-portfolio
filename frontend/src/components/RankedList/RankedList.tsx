import "./ranked-list.css";

export interface RankedItem {
  label: string;
  value: number;
}

interface Props {
  title: string;
  valueLabel: string;
  items: RankedItem[];
}

export default function RankedList({ title, valueLabel, items }: Props) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="analytics-card ranked-list">
      <div className="ranked-list-header">
        <p className="analytics-card-title">{title}</p>
        <p className="ranked-list-value-label">{valueLabel}</p>
      </div>
      {items.length === 0 && <p className="analytics-empty">No data for this period</p>}
      {items.map((item) => (
        <div className="ranked-list-row" key={item.label}>
          <div className="ranked-list-text">
            <p className="ranked-list-label" title={item.label}>
              {item.label}
            </p>
            <p className="ranked-list-value">{item.value.toLocaleString()}</p>
          </div>
          <div className="ranked-list-track">
            <div className="ranked-list-bar" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
