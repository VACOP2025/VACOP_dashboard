import os
import json
from datetime import datetime

from flask_mqtt import Mqtt

from backend.extensions import socketio, db
from backend.models import RobotPosition
from backend.services.telemetry_state import set_latest_position

mqtt_client = Mqtt()

# Explicit Flask app reference for MQTT callbacks (they run outside request contexts).
_FLASK_APP = None


def set_flask_app(app) -> None:
    """
    Register the Flask application instance for MQTT callbacks.

    MQTT callbacks are executed outside the normal Flask request lifecycle, which means
    there is no guaranteed application context. By storing the app reference, we can
    safely create an app context when persisting telemetry to the database.
    """
    global _FLASK_APP
    _FLASK_APP = app


def _ts_to_utc_datetime(ts_raw):
    """
    Convert incoming GNSS timestamps into a UTC datetime (stored as naive UTC).

    Your GNSS payload uses epoch seconds (float):
      "timestamp": 1769046345.0890594

    This helper also supports epoch milliseconds (>= 1e12) and ISO strings (best-effort).
    """
    if ts_raw is None:
        return datetime.utcnow()

    if isinstance(ts_raw, (int, float)):
        if ts_raw >= 1_000_000_000_000:  # epoch milliseconds heuristic
            ts_raw = ts_raw / 1000.0
        return datetime.utcfromtimestamp(ts_raw)

    if isinstance(ts_raw, str):
        try:
            s = ts_raw.replace("Z", "+00:00")
            dt = datetime.fromisoformat(s)
            # Store naive UTC for consistency with existing model serialization.
            return dt.replace(tzinfo=None)
        except Exception:
            return datetime.utcnow()

    return datetime.utcnow()


@mqtt_client.on_connect()
def handle_connect(client, userdata, flags, rc):
    """
    Subscribe to the GNSS topic when the MQTT client connects.
    """
    topic = os.getenv("MQTT_TOPIC", "robot/gnss")
    mqtt_client.subscribe(topic)
    print("[MQTT] connected rc=", rc, "to", client._host, ":", client._port, "subscribed", topic)


@mqtt_client.on_message()
def handle_mqtt_message(client, userdata, message):
    """
    Process GNSS telemetry received over MQTT.

    Real-time pipeline:
      MQTT -> parse -> payload -> set_latest_position -> socketio.emit("robot:position")

    Persistence pipeline:
      MQTT -> parse -> RobotPosition row -> Postgres
    """
    try:
        text = message.payload.decode("utf-8", errors="replace")
        data = json.loads(text)
        # Uncomment for verbose debugging:
        # print("[MQTT] msg on", message.topic, "payload=", text)
    except Exception:
        return

    lat_raw = data.get("latitude")
    lon_raw = data.get("longitude")
    ts_raw = data.get("timestamp")

    if lat_raw is None or lon_raw is None:
        return

    def to_deg(v):
        """
        Convert GNSS numeric formats into degrees.
        Some devices transmit integers scaled by 1e7.
        """
        if isinstance(v, (int, float)) and abs(v) > 1000:
            return v / 1e7
        return float(v)

    lat = to_deg(lat_raw)
    lng = to_deg(lon_raw)

    payload = {
        "ts": datetime.utcnow().isoformat() if ts_raw is None else ts_raw,
        "lat": lat,
        "lng": lng,
        "topic": message.topic,
    }

    # 1) Real-time update to the frontend.
    set_latest_position(payload)
    socketio.emit("robot:position", payload)

    # 2) Persist to DB for trajectory/history.
    if _FLASK_APP is None:
        # This means set_flask_app(app) was not called during app initialization.
        print("[DB] Skipping persist: Flask app not registered (call set_flask_app(app)).")
        return

    try:
        with _FLASK_APP.app_context():
            row = RobotPosition(
                robot_id=str(data.get("robot_id", "robot_1")),
                ts=_ts_to_utc_datetime(ts_raw),
                lat=lat,
                lng=lng,
                topic=message.topic,
                raw=data,
            )
            db.session.add(row)
            db.session.commit()

            # Keep this log while validating the pipeline.
            print("[DB] inserted RobotPosition id=", row.id, "robot_id=", row.robot_id)
    except Exception as exc:
        db.session.rollback()
        print("[DB] Failed to persist RobotPosition:", exc)


def publish_command(command: str, payload: dict) -> None:
    """
    Publish a command message to the MQTT broker.

    - Uses an environment-based topic prefix for consistency.
    - Serializes payload as JSON.
    - Provides a minimal debug log for validation.
    """
    base = os.getenv("MQTT_COMMAND_BASE", "robot/command").rstrip("/")
    topic = f"{base}/{command}"
    mqtt_client.publish(topic, json.dumps(payload))
    print("[MQTT] publish", topic, "payload=", payload)
