from flask import Blueprint, request, jsonify
from backend.services.mqtt_service import mqtt_client
import json
import os

gamepad_bp = Blueprint("gamepad", __name__, url_prefix="/command")

# Mapping des index vers des noms anglais clairs (snake_case)
# Basé sur le Standard Gamepad Layout
KEY_MAPPING = {
    0: "button_a",        # Cross
    1: "button_b",        # Circle
    2: "button_x",        # Square
    3: "button_y",        # Triangle
    4: "bumper_left",     # L1
    5: "bumper_right",    # R1
    6: "trigger_left",    # L2 (Analog)
    7: "trigger_right",   # R2 (Analog)
    8: "button_back",     # Select/Share
    9: "button_start",    # Start/Options
    10: "stick_left_click", # L3
    11: "stick_right_click",# R3
    12: "dpad_up",
    13: "dpad_down",
    14: "dpad_left",
    15: "dpad_right",
    16: "button_home"
}

def normalize_gamepad(raw_data):
    """
    Transforme le JSON brut complexe en un dictionnaire plat et lisible.
    Sortie : { "button_a": 0.0, "trigger_left": 0.5, "axis_left_x": -0.04, ... }
    """
    gp = raw_data.get("gamepad", {})
    normalized_output = {}

    # 1. Traitement des Boutons
    buttons = gp.get("buttons", [])
    for index, btn in enumerate(buttons):
        # On récupère le nom anglais, ou "unknown_X" si pas dans la liste
        key_name = KEY_MAPPING.get(index, f"unknown_{index}")
        
        # On récupère la valeur float (0 à 1). 
        # Note : Pour les boutons numériques, ce sera 0.0 ou 1.0
        # Pour les gâchettes (L2/R2), ce sera entre 0.0 et 1.0
        normalized_output[key_name] = float(btn.get("value", 0))

    # 2. Traitement des Axes (Joysticks)
    # Je les ajoute aussi car une manette sans stick est rarement utile
    axes = gp.get("axes", [])
    if len(axes) >= 4:
        # Les axes vont de -1.0 à 1.0
        normalized_output["axis_left_x"] = float(axes[0])
        normalized_output["axis_left_y"] = float(axes[1])
        normalized_output["axis_right_x"] = float(axes[2])
        normalized_output["axis_right_y"] = float(axes[3])

    return normalized_output

@gamepad_bp.route("/gamepad", methods=["POST"])
def command_gamepad():
    payload = request.get_json(silent=True) or {}
    
    if "gamepad" not in payload:
        return jsonify({"ok": False, "error": "No gamepad data"}), 400

    # --- TRANSFORMATION ---
    # On convertit le JSON brut en ton format souhaité
    clean_data = normalize_gamepad(payload)

    # --- ENVOI MQTT ---
    # On envoie maintenant le dictionnaire propre et simplifié
    base = os.getenv("MQTT_COMMAND_BASE", "robot/command")
    topic = f"{base}/gamepad"
    
    mqtt_client.publish(topic, json.dumps(clean_data))
    
    # Debug : Pour voir à quoi ça ressemble dans ta console
    # On affiche seulement les touches actives pour ne pas spammer
    active_keys = {k: v for k, v in clean_data.items() if abs(v) > 0.1}
    if active_keys:
        print(f"📤 Sent to MQTT: {active_keys}")

    return jsonify({"ok": True}), 200