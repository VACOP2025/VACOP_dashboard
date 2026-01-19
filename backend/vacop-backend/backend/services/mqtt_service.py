# python 3.11
import json
from paho.mqtt import client as mqtt_client

load_dotenv()  # loads .env into environment variables

BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
USERNAME = os.getenv("MQTT_USERNAME")
PASSWORD = os.getenv("MQTT_PASSWORD")
CLIENT_ID = os.getenv("MQTT_CLIENT_ID", "mqtt_reader_simple")
TOPIC = os.getenv("MQTT_TOPIC", "#")



def connect_mqtt() -> mqtt_client.Client:
    def on_connect(client, userdata, flags, reason_code, properties=None):
        if reason_code == 0:
            print("Connected to MQTT Broker!")
            client.subscribe(topic_loc_gnss, qos=0)
            print(f"Subscribed to {topic_loc_gnss}")
        else:
            print(f"Failed to connect, reason_code={reason_code}")

    def on_disconnect(client, userdata, reason_code, properties=None):
        print(f"Disconnected (reason_code={reason_code})")

    client = mqtt_client.Client(
        client_id=client_id,
        clean_session=True,
        callback_api_version=mqtt_client.CallbackAPIVersion.VERSION2,
    )
    client.username_pw_set(username, password)
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.connect(broker, port, keepalive=30)
    return client


def run():
    client = connect_mqtt()

    def on_message(client, userdata, msg):
        text = msg.payload.decode("utf-8", errors="replace")
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            print(f"[MSG] {msg.topic} -> (non-json) {text}")
            return

        ts = data.get("timestamp")
        lat_raw = data.get("latitude")
        lon_raw = data.get("longitude")

        # protect against missing fields
        if lat_raw is None or lon_raw is None:
            print(f"[MSG] {msg.topic} -> missing lat/lon: {data}")
            return

        lat = lat_raw / 1e7
        lon = lon_raw / 1e7

        print(f"[MSG] {msg.topic}")
        print("timestamp:", ts)
        print("latitude:", lat)
        print("longitude:", lon)

    client.on_message = on_message
    client.loop_forever()


if __name__ == "__main__":
    run()
