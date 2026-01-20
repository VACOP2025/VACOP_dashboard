from flask import Blueprint, request, jsonify
from backend.services.mqtt_service import mqtt_client
import json
import os

gamepad_bp = Blueprint("gamepad", __name__, url_prefix="/command")


@gamepad_bp.route("/gamepad", methods=["POST"])
def command_gamepad():
    """
    Receive gamepad state from the frontend and forward it to MQTT.

    This endpoint is called by the React app at:
      http://localhost:5000/command/gamepad
    """
    payload = request.get_json(silent=True) or {}
    gp = payload.get("gamepad")

    # Minimal validation to avoid publishing malformed data.
    if not isinstance(gp, dict):
        return jsonify({"ok": False, "error": "Missing or invalid 'gamepad' object"}), 400

    # Publish to MQTT using a predictable command topic.
    # Example topic: robot/command/gamepad
    base = os.getenv("MQTT_COMMAND_BASE", "robot/command")
    topic = f"{base}/gamepad"

    mqtt_client.publish(topic, json.dumps(payload))
    print("[HTTP] /command/gamepad -> MQTT", topic, "id=", gp.get("id"), "index=", gp.get("index"))

    return jsonify({"ok": True}), 200
