import json
import paho.mqtt.client as mqtt
from backend.extensions import socketio, db
from backend.models import Log
from datetime import datetime

TOPIC_TELEMETRY = "vacop/telemetry"
TOPIC_LOGS = "vacop/logs"
TOPIC_VIDEO_STATUS = "vacop/video"

class MQTTService:
    def __init__(self, app=None):
        self.client = mqtt.Client(client_id="VACOP_Backend_C2", protocol=mqtt.MQTTv311)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.app = app

    def init_app(self, app):
        self.app = app
        broker = app.config.get('MQTT_BROKER_URL', 'localhost')
        port = app.config.get('MQTT_BROKER_PORT', 1883)
        try:
            self.client.connect(broker, port, 60)
            self.client.loop_start()
            print(f"[MQTT] Connecté au broker {broker}:{port}")
        except Exception as e:
            print(f"[MQTT] Erreur de connexion: {e}")

    def on_connect(self, client, userdata, flags, rc):
        print(f"[MQTT] Connected with result code {rc}")
        client.subscribe([(TOPIC_TELEMETRY, 0), (TOPIC_LOGS, 0), (TOPIC_VIDEO_STATUS, 0)])

    def on_message(self, client, userdata, msg):
        topic = msg.topic
        payload = msg.payload.decode('utf-8')
        try:
            data = json.loads(payload)
        except:
            data = {"raw_message": payload}

        if topic == TOPIC_TELEMETRY:
            socketio.emit('telemetry_update', data, namespace='/')
        elif topic == TOPIC_LOGS:
            socketio.emit('new_log', data, namespace='/')
            if self.app:
                with self.app.app_context():
                    try:
                        new_log = Log(
                            level=data.get('level', 'INFO'),
                            source=data.get('source', 'vehicle'),
                            message=data.get('message', payload),
                            timestamp=datetime.utcnow()
                        )
                        db.session.add(new_log)
                        db.session.commit()
                    except Exception as e:
                        print(f"[MQTT] Erreur sauvegarde log DB: {e}")

    def publish_command(self, command_type, payload):
        topic = f"vacop/command/{command_type}"
        message = json.dumps(payload)
        self.client.publish(topic, message)
        print(f"[MQTT] Commande envoyée: {topic}")

mqtt_client = MQTTService()
