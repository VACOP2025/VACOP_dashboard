from flask import Blueprint, jsonify, request
from ..models import RobotPosition
from ..services.telemetry_state import get_latest_position
from ..extensions import db

telemetry_bp = Blueprint("telemetry", __name__, url_prefix="/api/telemetry")

@telemetry_bp.get("/latest")
def latest():
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
    robot_id = request.args.get("robot_id", "robot_1")
    limit = int(request.args.get("limit", "200"))
    rows = (
        db.session.query(RobotPosition)
        .filter(RobotPosition.robot_id == robot_id)
        .order_by(RobotPosition.ts.desc())
        .limit(limit)
        .all()
    )
    return jsonify([r.to_dict() for r in reversed(rows)])
