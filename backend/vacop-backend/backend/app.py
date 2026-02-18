from flask import Flask
from backend.extensions import db, jwt, socketio, bcrypt, cors
from backend.routes.auth import auth_bp
from backend.routes.mission import mission_bp
from backend.routes.telemetry import telemetry_bp   
from backend.services.mqtt_service import mqtt_client, set_flask_app
from backend.routes.gamepad import gamepad_bp
from backend.routes.map import map_bp
import os
from pathlib import Path
from dotenv import load_dotenv
from backend.routes.robot import robot_bp

# charge .env
from pathlib import Path

# Cherche .env dans:
# 1) backend/.env
# 2) racine projet (../.env depuis backend/)
_here = Path(__file__).resolve().parent
candidates = [
    _here / ".env",
    _here.parent / ".env",
]

for p in candidates:
    if p.exists():
        load_dotenv(p)
        print(f"[env] loaded: {p}")
        break
else:
    print("[env] WARNING: no .env found in candidates:", candidates)


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_vacop_2024')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost:5432/vacop_db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'jwt_secret_vacop_2024'
    app.config['MQTT_BROKER_URL'] = os.environ.get('MQTT_BROKER_URL', 'localhost')
    app.config["MQTT_BROKER_PORT"] = int(os.environ.get("MQTT_BROKER_PORT", "1883"))
    app.config["MQTT_USERNAME"] = os.environ.get("MQTT_USERNAME")
    app.config["MQTT_PASSWORD"] = os.environ.get("MQTT_PASSWORD")
    app.config["MQTT_KEEPALIVE"] = 30
    app.config["MQTT_TLS_ENABLED"] = False
    app.config["MQTT_PATH"] = os.getenv("MQTT_PATH", "").strip()

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={
    r"/*": {"origins": [
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]}
    })
    socketio.init_app(app)
    mqtt_client.init_app(app)
    set_flask_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(mission_bp)
    app.register_blueprint(telemetry_bp)  
    app.register_blueprint(gamepad_bp)
    app.register_blueprint(map_bp)
    app.register_blueprint(robot_bp)

    return app

if __name__ == '__main__':
    app = create_app()
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=False, 
    )

