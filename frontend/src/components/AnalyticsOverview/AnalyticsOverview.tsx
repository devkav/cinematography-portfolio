import { useState } from "react";
import { UAParser } from "ua-parser-js";
import { MdArrowDownward, MdArrowUpward } from "react-icons/md";
import { formatDuration } from "../SessionDisplay/SessionDisplay";
import VisitsChart from "../VisitsChart/VisitsChart";
import VisitorMap, { type MapView } from "../VisitorMap/VisitorMap";
import RankedList, { type RankedItem } from "../RankedList/RankedList";
import HourHeatmap from "../HourHeatmap/HourHeatmap";
import SplitBar from "../SplitBar/SplitBar";
import ColumnChart from "../ColumnChart/ColumnChart";
import type { AnalyticsSummary, LabelledCount } from "../AnalyticsDashboard/AnalyticsDashboard";

interface Props {
  summary: AnalyticsSummary;
  loading: boolean;
}

type ChartMetric = "visits" | "visitors" | "pageviews";

const CHART_LABELS: Record<ChartMetric, string> = {
  visits: "Visits",
  visitors: "Unique visitors",
  pageviews: "Pageviews"
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const TOP_REGIONS = 10;
const MAP_VIEWS: { view: MapView; label: string }[] = [
  { view: "world", label: "World" },
  { view: "us", label: "United States" }
];
const DEVICE_COLORS: Record<string, string> = {
  Desktop: "var(--analytics-accent)",
  Mobile: "var(--analytics-series-2)",
  Tablet: "var(--analytics-series-3)"
};

function groupUserAgents(userAgents: LabelledCount[], getLabel: (ua: UAParser.IResult) => string): RankedItem[] {
  const counts = new Map<string, number>();

  userAgents.forEach(({ label, visits }) => {
    const key = getLabel(UAParser(label));
    counts.set(key, (counts.get(key) ?? 0) + visits);
  });

  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export default function AnalyticsOverview({ summary, loading }: Props) {
  const [chartMetric, setChartMetric] = useState<ChartMetric>("visits");
  const [mapView, setMapView] = useState<MapView>("world");

  const { current, previous } = summary;
  const avgMinutes = Math.floor(current.avgDurationSeconds / 60);
  const avgSeconds = Math.round(current.avgDurationSeconds % 60);
  const chartLabel = CHART_LABELS[chartMetric];

  const tiles: {
    label: string;
    value: string;
    current: number | null;
    previous: number | null;
    goodWhenUp: boolean;
    metric?: ChartMetric;
  }[] = [
    {
      label: "Visits",
      value: current.visits.toLocaleString(),
      current: current.visits,
      previous: previous.visits,
      goodWhenUp: true,
      metric: "visits"
    },
    {
      label: "Unique visitors",
      value: current.uniqueVisitors?.toLocaleString() ?? "—",
      current: current.uniqueVisitors ?? null,
      previous: previous.uniqueVisitors ?? null,
      goodWhenUp: true,
      metric: "visitors"
    },
    {
      label: "Pageviews",
      value: current.pageviews.toLocaleString(),
      current: current.pageviews,
      previous: previous.pageviews,
      goodWhenUp: true,
      metric: "pageviews"
    },
    {
      label: "Avg. time on site",
      value: avgMinutes ? `${avgMinutes}min ${avgSeconds}s` : `${avgSeconds}s`,
      current: current.avgDurationSeconds,
      previous: previous.avgDurationSeconds,
      goodWhenUp: true
    },
    {
      label: "Bounce rate",
      value: `${(current.bounceRate * 100).toFixed(1)}%`,
      current: current.bounceRate,
      previous: previous.bounceRate,
      goodWhenUp: false
    }
  ];

  const maxPageViews = Math.max(...summary.topPages.map((page) => page.views), 1);
  const entryPages = summary.entryPages.map(({ label, visits }) => ({ label, value: visits }));

  const mapCounts = mapView === "us" ? (summary.usStates ?? []) : summary.countries;

  const topRegions = mapCounts.slice(0, TOP_REGIONS).map(({ label, visits }) => {
    let name = label;

    try {
      name = mapView === "us" ? label : (regionNames.of(label) ?? label);
    } catch {
      name = label;
    }

    return { label: name, value: visits };
  });

  const devices = groupUserAgents(summary.userAgents, ({ device }) => {
    const type = device.type ?? "desktop";
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    return DEVICE_COLORS[label] ? label : "Other";
  }).map((item) => ({ ...item, color: DEVICE_COLORS[item.label] ?? "var(--analytics-other)" }));

  const browsers = groupUserAgents(summary.userAgents, ({ browser }) => browser.name ?? "Unknown");

  return (
    <div className={`analytics-summary${loading ? " loading" : ""}`}>
      <div className="analytics-card">
        <div className="analytics-tiles">
          {tiles.map((tile) => {
            const change =
              tile.current !== null && tile.previous ? ((tile.current - tile.previous) / tile.previous) * 100 : null;
            const isGood = change !== null && change > 0 === tile.goodWhenUp;
            let className = "analytics-tile";
            let changeClassName = "analytics-tile-change";

            if (tile.metric) className += " selectable";
            if (tile.metric === chartMetric) className += " active";
            if (change) changeClassName += isGood ? " good" : " bad";

            const content = (
              <>
                <p className="analytics-tile-label">{tile.label}</p>
                <p className="analytics-tile-value">{tile.value}</p>
                <p className={changeClassName}>
                  {change !== null && change > 0 && <MdArrowUpward />}
                  {change !== null && change < 0 && <MdArrowDownward />}
                  {change === null ? "No prior data" : `${Math.abs(change).toFixed(1)}%`}
                </p>
              </>
            );

            return tile.metric ? (
              <button key={tile.label} className={className} onClick={() => setChartMetric(tile.metric!)}>
                {content}
              </button>
            ) : (
              <div key={tile.label} className={className}>
                {content}
              </div>
            );
          })}
        </div>
        <p className="analytics-card-subtitle">
          {chartLabel} per day · changes compared with the previous {summary.days} days
        </p>
        <VisitsChart
          label={chartLabel}
          points={summary.daily.map((day) => ({ date: day.date, value: day[chartMetric] ?? 0 }))}
        />
      </div>

      <div className="analytics-card analytics-map-card">
        <div className="analytics-map">
          <div className="analytics-map-header">
            <p className="analytics-card-title">Visitor locations</p>
            <div className="analytics-range">
              {MAP_VIEWS.map(({ view, label }) => (
                <button
                  key={view}
                  className={`analytics-range-button${view === mapView ? " active" : ""}`}
                  onClick={() => setMapView(view)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <VisitorMap view={mapView} counts={mapCounts} />
        </div>
        <div className="analytics-map-list">
          <RankedList
            title={mapView === "us" ? "Top states" : "Top countries"}
            valueLabel="Visits"
            items={topRegions}
          />
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card analytics-wide">
          <p className="analytics-card-title">Top pages</p>
          {summary.topPages.length === 0 ? (
            <p className="analytics-empty">No data for this period</p>
          ) : (
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th className="numeric">Views</th>
                  <th className="analytics-table-share">Share of views</th>
                  <th className="numeric">Avg. time</th>
                </tr>
              </thead>
              <tbody>
                {summary.topPages.map((page) => (
                  <tr key={page.page}>
                    <td className="analytics-table-page">{page.page}</td>
                    <td className="numeric">{page.views.toLocaleString()}</td>
                    <td className="analytics-table-share">
                      <div className="analytics-table-share-cell">
                        <div className="analytics-table-share-track">
                          <div
                            className="analytics-table-share-bar"
                            style={{ width: `${(page.views / maxPageViews) * 100}%` }}
                          />
                        </div>
                        <span>{Math.round((page.views / Math.max(current.pageviews, 1)) * 100)}%</span>
                      </div>
                    </td>
                    <td className="numeric">{formatDuration(page.avgDurationSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <RankedList title="Entry pages" valueLabel="Visits" items={entryPages} />
        {summary.heatmap && (
          <div className="analytics-wide">
            <HourHeatmap counts={summary.heatmap} />
          </div>
        )}
        <div className="analytics-stack">
          <SplitBar title="Devices" items={devices} />
          <ColumnChart title="Browsers" items={browsers} />
        </div>
      </div>
    </div>
  );
}
