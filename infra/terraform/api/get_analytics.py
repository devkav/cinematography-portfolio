import math
import os
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

import boto3
from common import build_response, is_allowed_origin


TABLE_NAME = os.getenv("ANALYTICS_TABLE_NAME", "analytics_db")
PAGE_SIZE = 20
GEO_FIELDS = ("country", "region", "regionName", "city", "latitude", "longitude", "userAgent", "visitorId")
DEFAULT_DAYS = 30
MAX_DAYS = 365
MAX_TZ_OFFSET_MINUTES = 14 * 60
TOP_LIMIT = 10
RAPID_SESSION_MIN_PAGES = 10
BOT_USER_AGENT_PATTERN = re.compile(
    r"bot|crawl|spider|slurp|scrape|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix"
    r"|pingdom|uptime|monitor|preview|facebookexternalhit|embedly|python|curl|wget|httpclient|okhttp|go-http"
    r"|java/|axios|node-fetch|undici|libwww|scrapy",
    re.IGNORECASE,
)
HOSTING_ASNS = {
    "8075",
    "12876",
    "14061",
    "14618",
    "15169",
    "16276",
    "16509",
    "20473",
    "24940",
    "31898",
    "37963",
    "45090",
    "45102",
    "47583",
    "51167",
    "60781",
    "63949",
    "132203",
    "396982",
}

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def totals(sessions):
    visits = len(sessions)
    pageviews = sum(len(session["actions"]) for session in sessions)
    total_duration = sum(session["totalDuration"] for session in sessions)
    bounces = sum(1 for session in sessions if len(session["actions"]) == 1)
    tracked_sessions = [session for session in sessions if session.get("visitorId")]

    return {
        "visits": visits,
        "uniqueVisitors": len({session["visitorId"] for session in tracked_sessions}) if tracked_sessions else None,
        "pageviews": pageviews,
        "avgDurationSeconds": round(float(total_duration) / visits, 1) if visits else 0,
        "bounceRate": round(bounces / visits, 4) if visits else 0,
    }


def ranked(counter, limit=None):
    return [{"label": label, "visits": count} for label, count in counter.most_common(limit)]


def handler(event, _):
    headers = event.get("headers") or {}
    headers_lower = {key.lower(): value for key, value in headers.items()}
    origin = headers_lower.get("origin")

    if not is_allowed_origin(origin):
        return build_response(403, {"error": f"Invalid origin: '{origin}'"}, origin)

    params = event.get("queryStringParameters") or {}

    try:
        page = max(int(params.get("page")), 1)
    except (TypeError, ValueError):
        page = 1

    try:
        days = min(max(int(params.get("days")), 1), MAX_DAYS)
    except (TypeError, ValueError):
        days = DEFAULT_DAYS

    try:
        tz_offset_minutes = min(max(int(params.get("tzOffset")), -MAX_TZ_OFFSET_MINUTES), MAX_TZ_OFFSET_MINUTES)
    except (TypeError, ValueError):
        tz_offset_minutes = 0

    utc_to_local = timedelta(minutes=-tz_offset_minutes)

    grouped = {}
    kwargs = {}

    while True:
        response = table.scan(**kwargs)

        for item in response.get("Items", []):
            grouped.setdefault(item.get("SessionID"), []).append(item)

        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break

        kwargs["ExclusiveStartKey"] = last_key

    sessions = []
    dated_sessions = []
    excluded_sessions = 0

    for session_id, views in grouped.items():
        views.sort(key=lambda view: view.get("Timestamp", ""))
        actions = []
        total_duration = 0

        for view in views:
            timestamp = view.get("Timestamp")
            duration = view.get("durationSeconds", 0)
            total_duration += duration

            action = {
                "page": view.get("page"),
                "timestamp": timestamp.split("#", 1)[0] if timestamp else timestamp,
                "durationSeconds": duration
            }

            actions.append(action)

        first = views[0]
        user_agent = first.get("userAgent") or ""

        if (
            not user_agent.startswith("Mozilla/")
            or BOT_USER_AGENT_PATTERN.search(user_agent)
            or not first.get("country")
            or str(first.get("asn", "")) in HOSTING_ASNS
            or (len(actions) >= RAPID_SESSION_MIN_PAGES and total_duration < len(actions))
        ):
            excluded_sessions += 1
            continue

        session = {"sessionId": session_id}
        session.update({field: first[field] for field in GEO_FIELDS if first.get(field) is not None})
        session["actions"] = actions
        session["totalDuration"] = total_duration
        sessions.append(session)

        try:
            started = datetime.fromisoformat(actions[0]["timestamp"])
        except (TypeError, ValueError):
            continue

        if started.tzinfo is None:
            started = started.replace(tzinfo=timezone.utc)

        dated_sessions.append((started + utc_to_local, session))

    sessions.sort(key=lambda session: session["actions"][-1]["timestamp"], reverse=True)

    today = (datetime.now(timezone.utc) + utc_to_local).date()
    range_start = today - timedelta(days=days - 1)
    previous_start = range_start - timedelta(days=days)

    current = [session for started, session in dated_sessions if range_start <= started.date() <= today]
    previous = [session for started, session in dated_sessions if previous_start <= started.date() < range_start]

    daily_visits = Counter()
    daily_pageviews = Counter()
    daily_visitors = defaultdict(set)
    heatmap = [[0] * 24 for _ in range(7)]

    for started, session in dated_sessions:
        if range_start <= started.date() <= today:
            daily_visits[started.date()] += 1
            daily_pageviews[started.date()] += len(session["actions"])
            heatmap[started.weekday()][started.hour] += 1

            if session.get("visitorId"):
                daily_visitors[started.date()].add(session["visitorId"])

    page_views = Counter()
    page_durations = Counter()
    entry_pages = Counter()
    countries = Counter()
    us_states = Counter()
    user_agents = Counter()

    for session in current:
        entry_pages[session["actions"][0]["page"]] += 1
        countries[session["country"]] += 1
        user_agents[session.get("userAgent", "")] += 1

        if session["country"] == "US" and session.get("regionName"):
            us_states[session["regionName"]] += 1

        for action in session["actions"]:
            page_views[action["page"]] += 1
            page_durations[action["page"]] += action["durationSeconds"]

    summary = {
        "days": days,
        "current": totals(current),
        "previous": totals(previous),
        "daily": [
            {
                "date": (range_start + timedelta(days=offset)).isoformat(),
                "visits": daily_visits[range_start + timedelta(days=offset)],
                "pageviews": daily_pageviews[range_start + timedelta(days=offset)],
                "visitors": len(daily_visitors[range_start + timedelta(days=offset)]),
            }
            for offset in range(days)
        ],
        "topPages": [
            {
                "page": page_name,
                "views": views,
                "avgDurationSeconds": round(float(page_durations[page_name]) / views, 1),
            }
            for page_name, views in page_views.most_common(TOP_LIMIT)
        ],
        "entryPages": ranked(entry_pages, TOP_LIMIT),
        "countries": ranked(countries),
        "usStates": ranked(us_states),
        "userAgents": ranked(user_agents),
        "heatmap": heatmap,
    }

    start = (page - 1) * PAGE_SIZE

    body = {
        "sessions": sessions[start:start + PAGE_SIZE],
        "page": page,
        "totalPages": math.ceil(len(sessions) / PAGE_SIZE),
        "totalSessions": len(sessions),
        "excludedSessions": excluded_sessions,
        "summary": summary,
    }

    return build_response(200, body, origin)
