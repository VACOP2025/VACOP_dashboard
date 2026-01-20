# python 3.11
from paho.mqtt import client as mqtt_client
import json 

broker = "neocampus.univ-tlse3.fr"
port = 10883

topic_loc_gnss = "TestTopic/VACOP/localisation/gnss"

client_id = "mqtt_reader_simple"
username = "test"
password = "test"


def connect_mqtt() -> mqtt_client.Client:
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker!")
            # S'abonner dès qu'on est connecté
            client.subscribe([(topic_loc_gnss, 0)])
        else:
            print(f"Failed to connect, return code {rc}")

    def on_disconnect(client, userdata, rc):
        print(f"Disconnected (rc={rc})")

    client = mqtt_client.Client(client_id=client_id, clean_session=True)
    client.username_pw_set(username, password)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect

    client.connect(broker, port, keepalive=30)
    return client


def run():
    client = connect_mqtt()

    def on_message(client, userdata, msg):
        text = msg.payload.decode("utf-8", errors="replace")
        print(f"Received `{text}` from `{msg.topic}` topic")

        try:
            data = json.loads(text)   # <- dict Python
        except json.JSONDecodeError:
            print("Payload is not valid JSON")
            return

        # accès aux champs
        longitude = data.get("longitude")/pow(10,7)
        latitude = data.get("latitude")/pow(10,7)
        timestamp = data.get("timestamp")

        print("timestamp:", timestamp)
        print("latitude:", latitude)
        print("longitude:", longitude)

    client.on_message = on_message
    client.loop_forever()


if __name__ == "__main__":
    run()