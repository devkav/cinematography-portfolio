import "./session-display.css"

import type { Session } from "../AnalyticsDashboard/AnalyticsDashboard";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useState } from "react";
import { UAParser } from "ua-parser-js";

interface Props {
  session: Session;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1]
];

const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(timestamp: string): string {
  const seconds = (Date.now() - new Date(timestamp).getTime()) / 1000;

  for (const [unit, secondsPerUnit] of UNITS) {
    if (seconds >= secondsPerUnit || unit === "second") {
      const formatted = relativeFormat.format(-Math.floor(seconds / secondsPerUnit), unit);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
  }

  return "Just now";
}

export default function SessionDisplay({session}: Props) {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => setOpen(!open);

  const firstTimestamp = timeAgo(session.actions[0].timestamp);
  const location = session.city ? `${session.city}, ${session.region}` :session.regionName;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${session.latitude},${session.longitude}`;

  const { browser, os, device } = UAParser(session.userAgent);
  const userAgentLabel = [browser.name, os.name].filter(Boolean).join(" on ") || "Unknown device";
  const deviceLabel = [device.vendor, device.type ?? "desktop"].filter(Boolean).join(" ");

  const actions = session.actions.map((action, index) => (
    <div className="action-item" key={`${session.sessionId}-action${index}`}>
      <div className="action-timeline">
        <div className="action-timeline-line"></div>
        <div className="action-timeline-tick"></div>
        <div className="action-timeline-line"></div>
      </div>
      <p className="action-label">{`${action.page} (${action.durationSeconds}s)`}</p>
    </div>
  ));

  return (
    <div className="session-display">
      <div className="session-display-header">
        <div className="session-display-label-container">
          <div className="session-display-label">
            <p className="session-location-label">{location}</p>
            <p className="session-timestamp-label">{firstTimestamp}</p>
          </div>
            <p className="session-id-label">{session.sessionId}</p>
        </div>
        <div className="session-display-icon" onClick={toggleOpen}>
          <MdKeyboardArrowDown />
        </div>
      </div>
      {open && <div className="session-details">
        <p>Device: {userAgentLabel} ({deviceLabel})</p>
        <p>Location: {location}, {session.country}</p>
        <p>Coordinates (approx.): <a href={mapsUrl} rel="noreferrer" target="_blank">{session.latitude}, {session.longitude}</a></p>

        <div className="actions-container">
          {actions}
        </div>
      </div>}
    </div>
  )
}
