import "./visits-chart.css";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import useElementWidth from "../../hooks/useElementWidth";

export interface ChartPoint {
  date: string;
  value: number;
}

interface Props {
  points: ChartPoint[];
  label: string;
}

const HEIGHT = 240;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 40 };
const TARGET_Y_TICKS = 4;
const MIN_X_LABEL_SPACING = 80;

export default function VisitsChart({ points, label }: Props) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const max = Math.max(...points.map((point) => point.value), 0);
  const roughStep = Math.max(max, 1) / TARGET_Y_TICKS;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const residual = roughStep / magnitude;
  const step = Math.max((residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude, 1);
  const yMax = Math.max(Math.ceil(max / step) * step, step);
  const yTicks = Array.from({ length: yMax / step + 1 }, (_, index) => index * step);
  const xStep = points.length > 1 ? innerWidth / (points.length - 1) : 0;
  const labelEvery = xStep ? Math.max(Math.ceil(MIN_X_LABEL_SPACING / xStep), 1) : 1;

  const x = (index: number) => MARGIN.left + index * xStep;
  const y = (value: number) => MARGIN.top + innerHeight - (value / yMax) * innerHeight;

  const linePath = points.map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point.value)}`).join(" ");
  const areaPath = points.length ? `${linePath} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : "";

  const formatDate = (date: string, options: Intl.DateTimeFormatOptions) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en", options);
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!points.length) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const index = xStep ? Math.round((event.clientX - bounds.left - MARGIN.left) / xStep) : 0;
    setActiveIndex(Math.min(Math.max(index, 0), points.length - 1));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? -1 : 1;
    setActiveIndex((current) => Math.min(Math.max((current ?? points.length - 1) + delta, 0), points.length - 1));
  };

  const active = activeIndex !== null ? points[activeIndex] : undefined;
  const tooltipLeft = activeIndex !== null ? Math.min(Math.max(x(activeIndex), 60), width - 60) : 0;

  return (
    <div className="visits-chart" ref={containerRef}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          tabIndex={0}
          role="img"
          aria-label={`${label} per day`}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActiveIndex(null)}
          onFocus={() => setActiveIndex(points.length - 1)}
          onBlur={() => setActiveIndex(null)}
          onKeyDown={onKeyDown}
        >
          {yTicks.map((tick) => (
            <g key={`y-${tick}`}>
              <line
                className="visits-chart-grid"
                x1={MARGIN.left}
                x2={MARGIN.left + innerWidth}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text
                className="visits-chart-axis"
                x={MARGIN.left - 8}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {tick.toLocaleString()}
              </text>
            </g>
          ))}
          {points.map(
            (point, index) =>
              index % labelEvery === 0 && (
                <text
                  className="visits-chart-axis"
                  key={`x-${point.date}`}
                  x={x(index)}
                  y={HEIGHT - 8}
                  textAnchor={index === 0 ? "start" : "middle"}
                >
                  {formatDate(point.date, { month: "short", day: "numeric" })}
                </text>
              )
          )}
          <path className="visits-chart-area" d={areaPath} />
          <path className="visits-chart-line" d={linePath} />
          {active && activeIndex !== null && (
            <>
              <line
                className="visits-chart-crosshair"
                x1={x(activeIndex)}
                x2={x(activeIndex)}
                y1={MARGIN.top}
                y2={MARGIN.top + innerHeight}
              />
              <circle className="visits-chart-dot" cx={x(activeIndex)} cy={y(active.value)} r={5} />
            </>
          )}
        </svg>
      )}
      {active && (
        <div className="chart-tooltip visits-chart-tooltip" style={{ left: tooltipLeft }}>
          <strong>
            {active.value.toLocaleString()} {label.toLowerCase()}
          </strong>
          <span>{formatDate(active.date, { weekday: "short", month: "short", day: "numeric" })}</span>
        </div>
      )}
    </div>
  );
}
