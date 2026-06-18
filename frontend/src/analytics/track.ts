const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL;

const SESSION_ID = crypto.randomUUID();

export interface PageView {
  page: string;
  viewId: string;
  enteredAt: string;
  durationSeconds: number;
}

export function sendPageView({ page, viewId, enteredAt, durationSeconds }: PageView): void {
  if (!ANALYTICS_URL) return;

  const url = `${ANALYTICS_URL}/c`;
  const payload = JSON.stringify({
    sessionId: SESSION_ID,
    page,
    viewId,
    enteredAt,
    durationSeconds
  });

  if (navigator.sendBeacon?.(url, payload)) return;

  fetch(url, { method: "POST", body: payload, keepalive: true }).catch(() => {});
}
