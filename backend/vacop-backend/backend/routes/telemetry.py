from flask import Blueprint, jsonify, request
from ..models import RobotPosition
from ..services.mqtt_service import get_latest_position
from ..extensions import db

bp = Blueprint("telemetry", __name__, url_prefix="/api/telemetry")

@bp.get("/latest")
def latest():
    pos = get_latest_position()
    # fallback to DB if server restarted and memory is empty
    if pos is None:
        row = (
            db.session.query(RobotPosition)
            .order_by(RobotPosition.ts.desc())
            .first()
        )
        return jsonify(row.to_dict() if row else None)
    return jsonify(pos)

@bp.get("/history")
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
