from flask import Blueprint, request, jsonify, current_app
from backend.services.mqtt_service import mqtt_client
import json
from datetime import datetime

robot_bp = Blueprint("robot", __name__, url_prefix="/command")


@robot_bp.route("/robot/connection", methods=["POST"])
def robot_connection():
    payload = request.get_json(silent=True) or {}
    is_connected = payload.get("isConnected")

    if not isinstance(is_connected, bool):
        return jsonify({"ok": False, "error": "Missing or invalid 'isConnected' (boolean expected)"}), 400

    mqtt_path = (current_app.config.get("MQTT_PATH") or "").strip()
    if not mqtt_path:
        return jsonify({"ok": False, "error": "MQTT_PATH is not set"}), 500

    topic = f"{mqtt_path.rstrip('/')}/robot/connection"

    msg = {
        "ts": datetime.utcnow().isoformat(),
        "isConnected": is_connected,
        "action": "connect" if is_connected else "disconnect",
    }

    mqtt_client.publish(topic, json.dumps(msg))
    print("[HTTP] /command/robot/connection -> MQTT", topic, "payload=", msg)

    return jsonify({"ok": True, "topic": topic, "published": msg}), 200
