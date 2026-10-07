import "./session-display.css";

import type { Session } from "../AnalyticsDashboard/AnalyticsDashboard";
import { MdChevronRight, MdDesktopWindows, MdKeyboardArrowDown, MdPhoneIphone, MdTabletMac } from "react-icons/md";
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

const UNIT_LABELS: Record<string, string> = {
  year: "yr",
  month: "mo",
  day: "d",
  hour: "hr",
  minute: "min",
  second: "s"
};

const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const dateFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

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

export function formatDuration(seconds: number): string {
  for (const [unit, secondsPerUnit] of UNITS) {
    if (seconds >= secondsPerUnit || unit === "second") {
      return `${Math.floor(seconds / secondsPerUnit)}${UNIT_LABELS[unit]}`;
    }
  }

  return "0s";
}

export default function SessionDisplay({ session }: Props) {
  const [open, setOpen] = useState(false);

  const startedAt = session.actions[0].timestamp;
  const location = session.city ? `${session.city}, ${session.region}` : session.regionName || "Unknown location";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${session.latitude},${session.longitude}`;

  let country = session.country ?? "";

  try {
    country = regionNames.of(session.country) ?? session.country;
  } catch {
    country = session.country ?? "";
  }

  const { browser, os, device } = UAParser(session.userAgent);
  const userAgentLabel = [browser.name, os.name].filter(Boolean).join(" on ") || "Unknown browser";
  const deviceType = device.type ?? "desktop";
  const deviceLabel = [device.vendor, deviceType.charAt(0).toUpperCase() + deviceType.slice(1)]
    .filter(Boolean)
    .join(" ");
  const DeviceIcon = deviceType === "mobile" ? MdPhoneIphone : deviceType === "tablet" ? MdTabletMac : MdDesktopWindows;

  return (
    <div className={`session-row${open ? " open" : ""}`}>
      <button className="session-row-main" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="session-cell session-cell-location">
          <p className="session-primary">{location}</p>
          <p className="session-secondary">{country}</p>
        </div>
        <div className="session-cell session-cell-time">
          <p className="session-primary">{timeAgo(startedAt)}</p>
          <p className="session-secondary">{dateFormat.format(new Date(startedAt))}</p>
        </div>
        <div className="session-cell session-cell-duration">
          <p className="session-primary">{formatDuration(session.totalDuration)}</p>
          <p className="session-secondary session-mobile-only">duration</p>
        </div>
        <div className="session-cell session-cell-pages">
          <p className="session-primary">{session.actions.length}</p>
          <p className="session-secondary session-mobile-only">{session.actions.length === 1 ? "page" : "pages"}</p>
        </div>
        <div className="session-cell session-cell-device">
          <DeviceIcon className="session-device-icon" />
          <div>
            <p className="session-primary">{deviceLabel}</p>
            <p className="session-secondary">{userAgentLabel}</p>
          </div>
        </div>
        <MdKeyboardArrowDown className="session-chevron" />
      </button>
      {open && (
        <div className="session-details">
          <p className="session-details-heading">Journey</p>
          <div className="session-journey">
            {session.actions.map((action, index) => (
              <div className="session-journey-step" key={`${session.sessionId}-action${index}`}>
                {index > 0 && <MdChevronRight className="session-journey-arrow" />}
                <div className="session-journey-page">
                  <p className="session-primary">{action.page}</p>
                  <p className="session-secondary">{formatDuration(action.durationSeconds)}</p>
                </div>
              </div>
            ))}
          </div>
          {session.latitude && session.longitude && (
            <p className="session-secondary session-coordinates">
              Approx. coordinates{" "}
              <a href={mapsUrl} rel="noreferrer" target="_blank">
                {session.latitude}, {session.longitude}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
