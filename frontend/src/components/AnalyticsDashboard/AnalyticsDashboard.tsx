import "./analytics-dashboard.css";

import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import SessionDisplay from "../SessionDisplay/SessionDisplay";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

const API_URL = import.meta.env.VITE_API_URL;
const NUM_PAGE_NUMBERS = 5;

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

interface AnalyticsData {
  sessions: Session[];
  page: number;
  totalPages: number;
}

export default function AnalyticsDashboard() {
  const { idToken } = useAuth();
  const [data, setData] = useState<AnalyticsData>();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!idToken) return;

    const url = new URL(`${API_URL}/analytics`);
    url.searchParams.set("page", String(page));

    fetch(url, {
      headers: { Authorization: idToken }
    })
      .then((res) => res.json())
      .then((data: AnalyticsData) => {
        setData(data);
      });
  }, [idToken, page]);

  const nextPage = () => {
    if (data == undefined) {
      return;
    }

    if (page < data?.totalPages) {
      setData(undefined);
      setPage(data?.page + 1);
    }
  };

  const prevPage = () => {
    if (data == undefined) {
      return;
    }

    if (page > 1) {
      setData(undefined);
      setPage(data?.page - 1);
    }
  };

  const goToPage = (page_index: number) => {
    if (page_index == page) {
      return;
    }

    setData(undefined);
    setPage(page_index);
  };

  const halfway_page = Math.ceil(NUM_PAGE_NUMBERS / 2);
  let start;

  if (data?.totalPages) {
    if (page < halfway_page) {
      start = 1;
    } else if (page + halfway_page > data?.totalPages) {
      start = (data?.totalPages - NUM_PAGE_NUMBERS) + 1;
    } else {
      start = (page - halfway_page) + 1;
    }
  }

  const pageButtons = Array.from({ length: start ? NUM_PAGE_NUMBERS : 0 }, (_, index) => {
    const actingIndex = start! + index;
    let className = "session-page-button";

    if (actingIndex == page) {
      className += " active";
    }

    return (
      <div className={className} onClick={() => goToPage(actingIndex)} key={`session-page-btn-${actingIndex}`}>
        <p>{actingIndex}</p>
      </div>
    );
  });

  const pageControls = (
    <div className="session-controls">
      <div className="session-prev-page-button" onClick={prevPage}>
        <MdChevronLeft />
      </div>
      {pageButtons}
      <div className="session-next-page-button" onClick={nextPage}>
        <MdChevronRight />
      </div>
    </div>
  );

  return (
    <div>
      <h3>Analytics</h3>
      <div className="session-display-list">
        {data && pageControls}
        {data?.sessions.map((session) => (
          <SessionDisplay session={session} key={`sessionDisplay-${session.sessionId}`} />
        ))}
        {data && pageControls}
      </div>
    </div>
  );
}
