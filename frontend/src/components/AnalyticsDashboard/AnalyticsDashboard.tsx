import "./analytics-dashboard.css";

import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import SessionDisplay from "../SessionDisplay/SessionDisplay";
import AnalyticsOverview from "../AnalyticsOverview/AnalyticsOverview";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

const API_URL = import.meta.env.VITE_API_URL;
const NUM_PAGE_NUMBERS = 5;
const RANGE_OPTIONS = [7, 30, 90];
const DEFAULT_RANGE = 30;

export interface Action {
  durationSeconds: number;
  page: string;
  timestamp: string;
}

export interface Session {
  actions: Action[];
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  region: string;
  regionName: string;
  sessionId: string;
  totalDuration: number;
  userAgent: string;
}

export interface LabelledCount {
  label: string;
  visits: number;
}

interface PeriodTotals {
  visits: number;
  uniqueVisitors?: number | null;
  pageviews: number;
  avgDurationSeconds: number;
  bounceRate: number;
}

export interface AnalyticsSummary {
  days: number;
  current: PeriodTotals;
  previous: PeriodTotals;
  daily: { date: string; visits: number; visitors?: number; pageviews: number }[];
  topPages: { page: string; views: number; avgDurationSeconds: number }[];
  entryPages: LabelledCount[];
  countries: LabelledCount[];
  userAgents: LabelledCount[];
  usStates?: LabelledCount[];
  heatmap?: number[][];
}

interface AnalyticsData {
  sessions: Session[];
  page: number;
  totalPages: number;
  totalSessions?: number;
  excludedSessions?: number;
  summary: AnalyticsSummary;
}

export default function AnalyticsDashboard() {
  const { idToken } = useAuth();
  const [data, setData] = useState<AnalyticsData>();
  const [summary, setSummary] = useState<AnalyticsSummary>();
  const [page, setPage] = useState(1);
  const [days, setDays] = useState(DEFAULT_RANGE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idToken) return;

    let cancelled = false;
    const url = new URL(`${API_URL}/analytics`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("days", String(days));
    url.searchParams.set("tzOffset", String(new Date().getTimezoneOffset()));

    setLoading(true);

    fetch(url, {
      headers: { Authorization: idToken }
    })
      .then((res) => res.json())
      .then((data: AnalyticsData) => {
        if (cancelled) return;

        setData(data);
        setSummary(data.summary);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idToken, page, days]);

  const totalPages = data?.totalPages ?? 0;

  const goToPage = (pageIndex: number) => {
    if (pageIndex === page || pageIndex < 1 || pageIndex > totalPages) {
      return;
    }

    setPage(pageIndex);
  };

  const halfwayPage = Math.ceil(NUM_PAGE_NUMBERS / 2);
  const numPageButtons = Math.min(NUM_PAGE_NUMBERS, totalPages);
  let start = 1;

  if (page >= halfwayPage) {
    start = page + halfwayPage > totalPages ? totalPages - numPageButtons + 1 : page - halfwayPage + 1;
  }

  const pageControls = totalPages > 1 && (
    <div className="session-controls">
      <button className="session-page-button" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
        <MdChevronLeft />
      </button>
      {Array.from({ length: numPageButtons }, (_, index) => start + index).map((pageIndex) => (
        <button
          className={`session-page-button${pageIndex === page ? " active" : ""}`}
          onClick={() => goToPage(pageIndex)}
          key={`session-page-btn-${pageIndex}`}
        >
          {pageIndex}
        </button>
      ))}
      <button className="session-page-button" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
        <MdChevronRight />
      </button>
    </div>
  );

  return (
    <div className="analytics-dashboard">
      <div className="analytics-heading">
        <div className="analytics-range">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={`range-${option}`}
              className={`analytics-range-button${option === days ? " active" : ""}`}
              onClick={() => setDays(option)}
            >
              Last {option} days
            </button>
          ))}
        </div>
      </div>
      {summary && <AnalyticsOverview summary={summary} loading={loading} />}
      {!summary && !loading && (
        <p className="analytics-empty">Summary data is unavailable. The analytics API may need to be redeployed.</p>
      )}
      <div className={`analytics-card session-list${loading ? " loading" : ""}`}>
        <div className="session-list-title">
          <div>
            <p className="analytics-card-title">Sessions</p>
            {data && (
              <p className="session-list-count">
                {data.totalSessions !== undefined && `${data.totalSessions.toLocaleString()} total · `}page {page} of{" "}
                {Math.max(totalPages, 1)}
                {!!data.excludedSessions && ` · ${data.excludedSessions.toLocaleString()} likely bots hidden`}
              </p>
            )}
          </div>
          {pageControls}
        </div>
        <div className="session-list-header">
          <span>Location</span>
          <span>Started</span>
          <span>Duration</span>
          <span>Pages</span>
          <span>Device</span>
          <span />
        </div>
        {data?.sessions.map((session) => (
          <SessionDisplay session={session} key={`sessionDisplay-${session.sessionId}`} />
        ))}
        {data && data.sessions.length === 0 && <p className="analytics-empty session-list-empty">No sessions yet</p>}
        {data && data.sessions.length > 0 && <div className="session-list-footer">{pageControls}</div>}
      </div>
    </div>
  );
}
