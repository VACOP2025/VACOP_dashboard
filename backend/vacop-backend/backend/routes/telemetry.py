from datetime import datetime
from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import RobotPosition
from ..services.telemetry_state import get_latest_position

telemetry_bp = Blueprint("telemetry", __name__, url_prefix="/api/telemetry")


@telemetry_bp.get("/latest")
def latest():
    """
    Return the latest known position.

    Priority:
    1) In-memory cache updated by MQTT (fast, real-time).
    2) Database fallback if the cache is empty (e.g., after restart).
    """
    pos = get_latest_position()
    if pos is not None:
        return jsonify(pos)

    # DB fallback only if available
    try:
        row = (
            db.session.query(RobotPosition)
            .order_by(RobotPosition.ts.desc())
            .first()
        )
        return jsonify(row.to_dict() if row else None)
    except Exception:
        # DB down -> just return None (no 500)
        return jsonify(None)


@telemetry_bp.get("/history")
def history():
    """
    Return historical positions for a robot.

    Query params:
      - robot_id: string (default "robot_1")
      - limit: int (default 200)
      - since_ms: epoch milliseconds (optional)
      - until_ms: epoch milliseconds (optional)

    Notes:
      - Timestamps are stored as naive UTC datetimes in the DB.
      - since_ms/until_ms allow the frontend to fetch only the relevant trajectory window.
      - Response is returned in chronological order (oldest -> newest).
    """
    robot_id = request.args.get("robot_id", "robot_1")
    limit = int(request.args.get("limit", "200"))

    since_ms_raw = request.args.get("since_ms")
    until_ms_raw = request.args.get("until_ms")

    q = db.session.query(RobotPosition).filter(RobotPosition.robot_id == robot_id)

    # Optional time window filtering
    if since_ms_raw is not None:
        try:
            since_ms = float(since_ms_raw)
            since_dt = datetime.utcfromtimestamp(since_ms / 1000.0)
            q = q.filter(RobotPosition.ts >= since_dt)
        except Exception:
            pass

    if until_ms_raw is not None:
        try:
            until_ms = float(until_ms_raw)
            until_dt = datetime.utcfromtimestamp(until_ms / 1000.0)
            q = q.filter(RobotPosition.ts <= until_dt)
        except Exception:
            pass

    # Query latest first, then reverse to send chronological for plotting
    rows_desc = q.order_by(RobotPosition.ts.desc()).limit(limit).all()
    rows = list(reversed(rows_desc))

    return jsonify([r.to_dict() for r in rows]), 200
