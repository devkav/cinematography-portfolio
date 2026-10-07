import "./split-bar.css";

export interface SplitItem {
  label: string;
  value: number;
  color: string;
}

interface Props {
  title: string;
  items: SplitItem[];
}

export default function SplitBar({ title, items }: Props) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const percent = (value: number) => `${Math.round((value / total) * 100)}%`;

  return (
    <div className="analytics-card split-bar">
      <p className="analytics-card-title">{title}</p>
      {total === 0 ? (
        <p className="analytics-empty">No data for this period</p>
      ) : (
        <>
          <div className="split-bar-track" role="img" aria-label={`${title} share of visits`}>
            {items.map((item) => (
              <div
                key={item.label}
                className="split-bar-segment"
                style={{ flexGrow: item.value, backgroundColor: item.color }}
                title={`${item.label}: ${item.value.toLocaleString()} (${percent(item.value)})`}
              />
            ))}
          </div>
          <div className="split-bar-legend">
            {items.map((item) => (
              <div className="split-bar-legend-item" key={item.label}>
                <span className="split-bar-swatch" style={{ backgroundColor: item.color }} />
                <p className="split-bar-label">{item.label}</p>
                <p className="split-bar-percent">{percent(item.value)}</p>
                <p className="split-bar-count">{item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
