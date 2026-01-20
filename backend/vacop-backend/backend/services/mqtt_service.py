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
    print(f"[MQTT] connected rc={rc}, subscribed to {topic}")

@mqtt_client.on_message()
def handle_mqtt_message(client, userdata, message):
    try:
        text = message.payload.decode("utf-8", errors="replace")
        data = json.loads(text)
    except Exception:
        return

    lat_raw = data.get("latitude")
    lon_raw = data.get("longitude")
    ts_raw = data.get("timestamp")

    if lat_raw is None or lon_raw is None:
        return

    lat = lat_raw / 1e7
    lng = lon_raw / 1e7

    ayload = {
        "ts": datetime.utcnow().isoformat() if ts_raw is None else ts_raw,
        "lat": lat,
        "lnpg": lng,
        "topic": message.topic,
    }

    set_latest_position(payload)
    socketio.emit("robot:position", payload)
