import os
import json
from datetime import datetime

from flask_mqtt import Mqtt

from backend.extensions import socketio
from backend.services.telemetry_state import set_latest_position

mqtt_client = Mqtt()

@mqtt_client.on_connect()
def handle_connect(client, userdata, flags, rc):
    topic = os.getenv("MQTT_TOPIC", "robot/gnss")
    mqtt_client.subscribe(topic)
    #print("[MQTT] connected rc=", rc, "to", client._host, ":", client._port, "subscribed", topic)


@mqtt_client.on_message()
def handle_mqtt_message(client, userdata, message):
    try:
        text = message.payload.decode("utf-8", errors="replace")
        data = json.loads(text)
        #print("[MQTT] msg on", message.topic, "payload=", text)

    except Exception:
        return

    lat_raw = data.get("latitude")
    lon_raw = data.get("longitude")
    ts_raw = data.get("timestamp")

    if lat_raw is None or lon_raw is None:
        return

    def to_deg(v):
        if isinstance(v, (int, float)) and abs(v) > 1000:  # typiquement ~4e8 si /1e7 nécessaire
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



    set_latest_position(payload)
    socketio.emit("robot:position", payload)

def publish_command(command: str, payload: dict) -> None:
    """
    Publish a command message to the MQTT broker.

    - Uses an environment-based topic prefix for consistency.
    - Serializes payload as JSON.
    - Provides a minimal debug log for validation.
    """
    base = os.getenv("MQTT_COMMAND_BASE", "robot/command")
    topic = f"{base}/{command}"

    mqtt_client.publish(topic, json.dumps(payload))
    print("[MQTT] publish", topic)


