import "./hour-heatmap.css";

import { useState, type PointerEvent } from "react";
import useElementWidth from "../../hooks/useElementWidth";

interface Props {
  counts: number[][];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const LEVELS = 5;
const HOUR_LABEL_EVERY = 3;
const VERTICAL_BREAKPOINT = 560;

function formatHour(hour: number): string {
  const suffix = hour < 12 ? "am" : "pm";
  return `${hour % 12 || 12}${suffix}`;
}

export default function HourHeatmap({ counts }: Props) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<{ day: number; hour: number; x: number; y: number }>();

  const vertical = width > 0 && width < VERTICAL_BREAKPOINT;
  const max = Math.max(...counts.flat(), 0);
  let peak = { day: 0, hour: 0, value: 0 };

  counts.forEach((hours, day) =>
    hours.forEach((value, hour) => {
      if (value > peak.value) peak = { day, hour, value };
    })
  );

  const levelColor = (level: number) =>
    level ? `color-mix(in srgb, var(--analytics-accent) ${(level / LEVELS) * 100}%, #1a1a1a)` : undefined;

  const onCellEnter = (event: PointerEvent<HTMLDivElement>, day: number, hour: number) => {
    const cell = event.currentTarget;
    setActive({ day, hour, x: cell.offsetLeft + cell.offsetWidth / 2, y: cell.offsetTop });
  };

  const renderCell = (day: number, hour: number) => {
    const value = counts[day][hour];

    return (
      <div
        key={`${day}-${hour}`}
        className={`hour-heatmap-cell${active?.day === day && active.hour === hour ? " active" : ""}`}
        style={{ backgroundColor: levelColor(value ? Math.ceil((value / max) * LEVELS) : 0) }}
        onPointerEnter={(event) => onCellEnter(event, day, hour)}
      />
    );
  };

  const hourLabel = (hour: number) => (
    <span key={`hour-${hour}`} className="hour-heatmap-axis hour-heatmap-hour">
      {hour % HOUR_LABEL_EVERY === 0 ? formatHour(hour) : ""}
    </span>
  );

  const dayLabel = (day: number) => (
    <span key={`day-${day}`} className="hour-heatmap-axis">
      {DAYS[day]}
    </span>
  );

  const activeValue = active ? counts[active.day][active.hour] : 0;

  return (
    <div className="analytics-card hour-heatmap">
      <p className="analytics-card-title">When people visit</p>
      <p className="hour-heatmap-subtitle">
        {peak.value ? `Busiest on ${FULL_DAYS[peak.day]} around ${formatHour(peak.hour)}` : "No visits in this period"}
      </p>
      <div className="hour-heatmap-body" ref={containerRef} onPointerLeave={() => setActive(undefined)}>
        <div
          className={`hour-heatmap-grid${vertical ? " vertical" : ""}`}
          role="img"
          aria-label="Visits by day of week and hour of day"
        >
          {vertical ? (
            <>
              <span />
              {DAYS.map((_, day) => dayLabel(day))}
              {HOURS.flatMap((hour) => [hourLabel(hour), ...DAYS.map((_, day) => renderCell(day, hour))])}
            </>
          ) : (
            <>
              {DAYS.flatMap((_, day) => [dayLabel(day), ...HOURS.map((hour) => renderCell(day, hour))])}
              <span />
              {HOURS.map(hourLabel)}
            </>
          )}
        </div>
        {active && (
          <div className="chart-tooltip hour-heatmap-tooltip" style={{ left: active.x, top: active.y }}>
            <strong>
              {activeValue.toLocaleString()} {activeValue === 1 ? "visit" : "visits"}
            </strong>
            <span>
              {DAYS[active.day]} {formatHour(active.hour)}–{formatHour((active.hour + 1) % 24)}
            </span>
          </div>
        )}
      </div>
      <div className="hour-heatmap-legend">
        <span>Fewer</span>
        {Array.from({ length: LEVELS + 1 }, (_, level) => (
          <div key={`legend-${level}`} className="hour-heatmap-cell" style={{ backgroundColor: levelColor(level) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
