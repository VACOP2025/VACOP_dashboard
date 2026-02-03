from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from backend.models import Mission, Log
from backend.extensions import db, socketio
from backend.services.mqtt_service import mqtt_client
from datetime import datetime

mission_bp = Blueprint('mission', __name__, url_prefix='/vehicle')

def admin_required(fn):
    from functools import wraps
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify(msg="Droits administrateur requis"), 403
        return fn(*args, **kwargs)
    return wrapper

@mission_bp.route('/mission', methods=['POST'])
@admin_required
def start_mission():
    data = request.get_json()
    current_user_id = get_jwt()["sub"]
    destination = data.get('destination')

    if not destination:
        return jsonify({"msg": "Destination requise"}), 400

    new_mission = Mission(status='active', destination=destination, user_id=current_user_id)
    db.session.add(new_mission)
    db.session.commit()

    payload = {"mission_id": new_mission.id, "destination": destination, "action": "start"}
    mqtt_client.publish_command("mission", payload)

    socketio.emit('mission_status', new_mission.to_dict())
    return jsonify(new_mission.to_dict()), 201

@mission_bp.route('/abort', methods=['POST'])
@jwt_required()
def abort_mission():
    mqtt_client.publish_command("emergency", {"action": "STOP_IMMEDIATE"})
    active_mission = Mission.query.filter_by(status='active').first()
    if active_mission:
        active_mission.status = 'aborted'
        active_mission.end_time = datetime.utcnow()
        db.session.commit()
        socketio.emit('mission_status', active_mission.to_dict())
    return jsonify({"msg": "Arrêt d'urgence envoyé"}), 200

@mission_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_logs():
    level = request.args.get('level')
    limit = request.args.get('limit', 100, type=int)
    query = Log.query.order_by(Log.timestamp.desc())
    if level:
        query = query.filter_by(level=level)
    logs = query.limit(limit).all()
    return jsonify([log.to_dict() for log in logs]), 200

@mission_bp.route('/goal', methods=['POST'])
def publish_goal():
    data = request.get_json()
    # User requested specific structure validation could be done here, 
    # but we will just pass it through to MQTT /goal topic.
    
    # "pose: ..., behavior_tree: ''" is expected in 'data'
    
    # Publish to /goal
    # mqtt_client.publish is not directly exposed but we can use the client object
    # The user said "le backend publiera cela sur un topic mqtt qui s'apelle /goal"
    
    try:
        from backend.services.mqtt_service import mqtt_client
        import json
        
        # Ensure we publish exactly what is requested
        # If the frontend sends the whole object, we send it.
        mqtt_client.publish("/goal", json.dumps(data))
        
        return jsonify({"msg": "Goal published"}), 200
    except Exception as e:
        return jsonify({"msg": f"Failed to publish goal: {str(e)}"}), 500