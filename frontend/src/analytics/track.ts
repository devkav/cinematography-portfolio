const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL;

const VISITOR_ID_KEY = "analytics_visitor_id";
const SESSION_KEY = "analytics_session";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

interface StoredSession {
  id: string;
  lastActivity: number;
}

const fallbackVisitorId = crypto.randomUUID();
let fallbackSession: StoredSession = { id: crypto.randomUUID(), lastActivity: 0 };

function readSession(): StoredSession {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") ?? fallbackSession;
  } catch {
    return fallbackSession;
  }
}

function writeSession(session: StoredSession): void {
  fallbackSession = session;

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    return;
  }
}

function getVisitorId(): string {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    return visitorId;
  } catch {
    return fallbackVisitorId;
  }
}

export function startSessionView(): string {
  const now = Date.now();
  const session = readSession();
  const id = now - session.lastActivity > SESSION_TIMEOUT_MS ? crypto.randomUUID() : session.id;

  writeSession({ id, lastActivity: now });
  return id;
}

export interface PageView {
  sessionId: string;
  page: string;
  viewId: string;
  enteredAt: string;
  durationSeconds: number;
}

export function sendPageView({ sessionId, page, viewId, enteredAt, durationSeconds }: PageView): void {
  if (!ANALYTICS_URL) return;

  if (readSession().id === sessionId) {
    writeSession({ id: sessionId, lastActivity: Date.now() });
  }

  const url = `${ANALYTICS_URL}/c`;
  const payload = JSON.stringify({
    sessionId,
    visitorId: getVisitorId(),
    page,
    viewId,
    enteredAt,
    durationSeconds
  });

  if (navigator.sendBeacon?.(url, payload)) return;

  fetch(url, { method: "POST", body: payload, keepalive: true }).catch(() => {});
}
