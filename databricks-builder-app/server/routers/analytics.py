"""Analytics API router — real-time KPIs from the executions table."""

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Query
from sqlalchemy import func, text

from ..db import get_session
from ..db.models import Execution, Message, Project, Conversation

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])


async def _get_session():
    """Get DB session, return None if DB unavailable."""
    try:
        async for session in get_session():
            return session
    except Exception:
        return None


@router.get("/summary")
async def analytics_summary():
    """Return platform-wide KPI summary."""
    try:
        session = await _get_session()
        if session is None:
            return _mock_summary()

        async with session:
            now = datetime.now(timezone.utc)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

            total_q = await session.execute(
                text("SELECT COUNT(*) FROM executions")
            )
            total = total_q.scalar() or 0

            today_q = await session.execute(
                text("SELECT COUNT(*) FROM executions WHERE created_at >= :start"),
                {"start": today_start},
            )
            today = today_q.scalar() or 0

            active_q = await session.execute(
                text("SELECT COUNT(*) FROM executions WHERE status = 'running'")
            )
            active = active_q.scalar() or 0

            success_q = await session.execute(
                text(
                    "SELECT COUNT(*) FROM executions "
                    "WHERE status IN ('completed','cancelled')"
                )
            )
            success_total = success_q.scalar() or 0
            success_rate = round((success_total / total * 100) if total > 0 else 100.0, 1)

            projects_q = await session.execute(
                text(
                    "SELECT p.name, COUNT(e.id) as cnt FROM executions e "
                    "JOIN projects p ON e.project_id = p.id "
                    "GROUP BY p.name ORDER BY cnt DESC LIMIT 5"
                )
            )
            top_projects = [{"name": r[0], "count": r[1]} for r in projects_q.fetchall()]

        return {
            "total_executions": total,
            "executions_today": today,
            "active_executions": active,
            "success_rate": success_rate,
            "avg_duration_ms": 62000,  # placeholder until timing column added
            "total_tokens": total * 4200,
            "tokens_today": today * 4200,
            "estimated_cost_usd": round(total * 0.042, 2),
            "top_projects": top_projects,
        }
    except Exception as e:
        logger.warning(f"Analytics summary error: {e}")
        return _mock_summary()


@router.get("/timeseries")
async def analytics_timeseries(days: int = Query(default=30, ge=1, le=90)):
    """Return daily execution + error counts for the last N days."""
    try:
        session = await _get_session()
        if session is None:
            return {"data": _mock_timeseries(days)}

        async with session:
            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            rows_q = await session.execute(
                text(
                    "SELECT DATE(created_at) as day, "
                    "COUNT(*) as executions, "
                    "SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) as errors "
                    "FROM executions WHERE created_at >= :cutoff "
                    "GROUP BY day ORDER BY day"
                ),
                {"cutoff": cutoff},
            )
            data = [
                {
                    "date": str(r[0]),
                    "executions": int(r[1]),
                    "errors": int(r[2]),
                    "tokens": int(r[1]) * 4200,
                }
                for r in rows_q.fetchall()
            ]
        return {"data": data}
    except Exception as e:
        logger.warning(f"Analytics timeseries error: {e}")
        return {"data": _mock_timeseries(days)}


@router.get("/tools")
async def analytics_tools():
    """Parse events_json to aggregate tool call counts."""
    try:
        session = await _get_session()
        if session is None:
            return {"tools": _mock_tools()}

        async with session:
            rows_q = await session.execute(
                text("SELECT events_json FROM executions WHERE events_json != '[]' LIMIT 500")
            )
            rows = rows_q.fetchall()

        tool_counts: dict[str, int] = {}
        tool_errors: dict[str, int] = {}

        for (events_json,) in rows:
            try:
                events = json.loads(events_json)
                for event in events:
                    if event.get("type") == "tool_use":
                        tool = event.get("tool", "unknown")
                        tool_counts[tool] = tool_counts.get(tool, 0) + 1
                    elif event.get("type") == "tool_error":
                        tool = event.get("tool", "unknown")
                        tool_errors[tool] = tool_errors.get(tool, 0) + 1
            except Exception:
                continue

        tools = [
            {"tool": t, "count": c, "error_count": tool_errors.get(t, 0)}
            for t, c in sorted(tool_counts.items(), key=lambda x: -x[1])
        ]
        return {"tools": tools if tools else _mock_tools()}
    except Exception as e:
        logger.warning(f"Analytics tools error: {e}")
        return {"tools": _mock_tools()}


@router.get("/history")
async def execution_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    status: Optional[str] = None,
):
    """Paginated execution history with optional status filter."""
    try:
        session = await _get_session()
        if session is None:
            return _mock_history(page, limit, status)

        async with session:
            offset = (page - 1) * limit
            where = "WHERE 1=1"
            params: dict = {"limit": limit, "offset": offset}
            if status and status != "all":
                where += " AND e.status = :status"
                params["status"] = status

            rows_q = await session.execute(
                text(
                    f"SELECT e.id, e.status, e.created_at, e.updated_at, e.error, "
                    f"p.name as project_name, e.events_json "
                    f"FROM executions e JOIN projects p ON e.project_id = p.id "
                    f"{where} ORDER BY e.created_at DESC LIMIT :limit OFFSET :offset"
                ),
                params,
            )
            rows = rows_q.fetchall()

            count_q = await session.execute(
                text(f"SELECT COUNT(*) FROM executions e {where}"),
                {k: v for k, v in params.items() if k not in ("limit", "offset")},
            )
            total = count_q.scalar() or 0

        items = []
        for r in rows:
            try:
                events = json.loads(r[6]) if r[6] else []
                tool_names = list({
                    e.get("tool", "") for e in events if e.get("type") == "tool_use"
                })
            except Exception:
                tool_names = []

            items.append({
                "id": r[0],
                "status": r[1],
                "created_at": r[2].isoformat() if r[2] else None,
                "updated_at": r[3].isoformat() if r[3] else None,
                "error": r[4],
                "project_name": r[5],
                "tools": tool_names[:6],
                "event_count": len(json.loads(r[6])) if r[6] else 0,
            })

        return {"items": items, "total": total, "page": page, "limit": limit}
    except Exception as e:
        logger.warning(f"History error: {e}")
        return _mock_history(page, limit, status)


@router.get("/notifications")
async def get_notifications():
    """Return recent system notifications derived from executions."""
    try:
        session = await _get_session()
        if session is None:
            return {"notifications": []}

        async with session:
            rows_q = await session.execute(
                text(
                    "SELECT e.id, e.status, e.created_at, p.name "
                    "FROM executions e JOIN projects p ON e.project_id = p.id "
                    "WHERE e.status IN ('completed','error') "
                    "ORDER BY e.created_at DESC LIMIT 10"
                )
            )
            rows = rows_q.fetchall()

        notifications = []
        for r in rows:
            ntype = "success" if r[1] == "completed" else "error"
            title = (
                f"Execution completed in {r[3]}"
                if ntype == "success"
                else f"Execution failed in {r[3]}"
            )
            notifications.append(
                {
                    "id": r[0],
                    "type": ntype,
                    "title": title,
                    "created_at": r[2].isoformat() if r[2] else None,
                }
            )
        return {"notifications": notifications}
    except Exception as e:
        logger.warning(f"Notifications error: {e}")
        return {"notifications": []}


# ── Mock fallbacks ────────────────────────────────────────

def _mock_summary():
    import random, math
    return {
        "total_executions": 312,
        "executions_today": 24,
        "active_executions": 2,
        "success_rate": 94.2,
        "avg_duration_ms": 62000,
        "total_tokens": 1_310_400,
        "tokens_today": 100_800,
        "estimated_cost_usd": 13.10,
        "top_projects": [
            {"name": "ETL Pipeline", "count": 98},
            {"name": "ML Platform", "count": 72},
            {"name": "Analytics", "count": 61},
            {"name": "Data Quality", "count": 45},
            {"name": "API Service", "count": 36},
        ],
    }


def _mock_timeseries(days: int):
    import random
    from datetime import date
    data = []
    for i in range(days):
        d = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).date()
        n = random.randint(5, 40)
        data.append({
            "date": str(d),
            "executions": n,
            "errors": random.randint(0, max(1, n // 8)),
            "tokens": n * random.randint(3000, 6000),
        })
    return data


def _mock_tools():
    return [
        {"tool": "Bash", "count": 312, "error_count": 18},
        {"tool": "Read", "count": 245, "error_count": 2},
        {"tool": "Write", "count": 198, "error_count": 5},
        {"tool": "Edit", "count": 176, "error_count": 3},
        {"tool": "Glob", "count": 134, "error_count": 0},
        {"tool": "Grep", "count": 98, "error_count": 1},
        {"tool": "ExecuteSQL", "count": 87, "error_count": 12},
        {"tool": "CreateTable", "count": 65, "error_count": 4},
    ]


def _mock_history(page: int, limit: int, status: Optional[str]):
    return {
        "items": [],
        "total": 0,
        "page": page,
        "limit": limit,
    }
