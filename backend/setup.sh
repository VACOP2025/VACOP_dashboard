#!/bin/bash

# Définition des couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}>>> Début de l'initialisation du projet VACOP Backend (C2)...${NC}"

# 1. Création de l'arborescence
echo -e "${GREEN}1. Création des dossiers...${NC}"
mkdir -p vacop-backend/backend/{routes,services,utils}
cd vacop-backend

# 2. Création des fichiers __init__.py (vides) pour rendre les dossiers "importables"
echo -e "${GREEN}2. Création des __init__.py...${NC}"
touch backend/__init__.py
touch backend/routes/__init__.py
touch backend/services/__init__.py
touch backend/utils/__init__.py

# 3. Génération des fichiers avec leur contenu
echo -e "${GREEN}3. Écriture des fichiers sources...${NC}"

# --- requirements.txt ---
cat << 'EOF' > requirements.txt
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
Flask-JWT-Extended==4.5.3
Flask-SocketIO==5.3.6
Flask-Cors==4.0.0
Flask-Bcrypt==1.0.1
psycopg2-binary==2.9.9
paho-mqtt==1.6.1
python-dotenv==1.0.0
eventlet==0.33.3
EOF

# --- backend/extensions.py ---
cat << 'EOF' > backend/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
cors = CORS()
socketio = SocketIO(cors_allowed_origins="*")
EOF

# --- backend/models.py ---
cat << 'EOF' > backend/models.py
from backend.extensions import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')

class Mission(db.Model):
    __tablename__ = 'missions'
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), default='pending', nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    destination = db.Column(JSON, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_by = db.relationship('User', backref=db.backref('missions', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'status': self.status,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'destination': self.destination,
            'created_by': self.created_by.username
        }

class Log(db.Model):
    __tablename__ = 'logs'
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    level = db.Column(db.String(10), nullable=False)
    source = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    mission_id = db.Column(db.Integer, db.ForeignKey('missions.id'), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'level': self.level,
            'source': self.source,
            'message': self.message,
            'mission_id': self.mission_id
        }
EOF

# --- backend/services/mqtt_service.py ---
cat << 'EOF' > backend/services/mqtt_service.py
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
EOF

# --- backend/routes/auth.py ---
cat << 'EOF' > backend/routes/auth.py
from flask import Blueprint, request, jsonify
from backend.models import User
from backend.extensions import db, bcrypt
from flask_jwt_extended import create_access_token
from datetime import timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"msg": "Nom d'utilisateur et mot de passe requis"}), 400

    user = User.query.filter_by(username=username).first()

    if user and bcrypt.check_password_hash(user.password_hash, password):
        access_token = create_access_token(
            identity=user.id,
            additional_claims={"role": user.role, "username": user.username},
            expires_delta=timedelta(days=1)
        )
        return jsonify({
            "access_token": access_token,
            "role": user.role,
            "username": user.username
        }), 200
    
    return jsonify({"msg": "Identifiants invalides"}), 401
EOF

# --- backend/routes/mission.py ---
cat << 'EOF' > backend/routes/mission.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from backend.models import Mission, Log
from backend.extensions import db, socketio
from backend.services.mqtt_service import mqtt_client
from datetime import datetime

mission_bp = Blueprint('mission', __name__, url_prefix='/vehicle')

def admin_required(fn):
    from functools import wraps
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify(msg="Droits administrateur requis"), 403
        return fn(*args, **kwargs)
    return wrapper

@mission_bp.route('/mission', methods=['POST'])
@admin_required
def start_mission():
    data = request.get_json()
    current_user_id = get_jwt()["sub"]
    destination = data.get('destination')

    if not destination:
        return jsonify({"msg": "Destination requise"}), 400

    new_mission = Mission(status='active', destination=destination, user_id=current_user_id)
    db.session.add(new_mission)
    db.session.commit()

    payload = {"mission_id": new_mission.id, "destination": destination, "action": "start"}
    mqtt_client.publish_command("mission", payload)

    socketio.emit('mission_status', new_mission.to_dict())
    return jsonify(new_mission.to_dict()), 201

@mission_bp.route('/abort', methods=['POST'])
@jwt_required()
def abort_mission():
    mqtt_client.publish_command("emergency", {"action": "STOP_IMMEDIATE"})
    active_mission = Mission.query.filter_by(status='active').first()
    if active_mission:
        active_mission.status = 'aborted'
        active_mission.end_time = datetime.utcnow()
        db.session.commit()
        socketio.emit('mission_status', active_mission.to_dict())
    return jsonify({"msg": "Arrêt d'urgence envoyé"}), 200

@mission_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_logs():
    level = request.args.get('level')
    limit = request.args.get('limit', 100, type=int)
    query = Log.query.order_by(Log.timestamp.desc())
    if level:
        query = query.filter_by(level=level)
    logs = query.limit(limit).all()
    return jsonify([log.to_dict() for log in logs]), 200
EOF

# --- backend/app.py ---
cat << 'EOF' > backend/app.py
from flask import Flask
from backend.extensions import db, jwt, socketio, bcrypt, cors
from backend.routes.auth import auth_bp
from backend.routes.mission import mission_bp
from backend.services.mqtt_service import mqtt_client
import os

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_vacop_2024')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost:5432/vacop_db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'jwt_secret_vacop_2024'
    app.config['MQTT_BROKER_URL'] = os.environ.get('MQTT_BROKER_URL', 'localhost')
    
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app)
    socketio.init_app(app)
    mqtt_client.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(mission_bp)

    return app

if __name__ == '__main__':
    app = create_app()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
EOF

# --- seed.py ---
cat << 'EOF' > seed.py
from backend.app import create_app
from backend.extensions import db, bcrypt
from backend.models import User

app = create_app()

def seed_database():
    with app.app_context():
        print("Création des tables...")
        db.create_all()
        if not User.query.filter_by(username='admin').first():
            print("Création de l'admin...")
            hashed_pw = bcrypt.generate_password_hash('vacop_admin_2026').decode('utf-8')
            admin = User(username='admin', password_hash=hashed_pw, role='admin')
            db.session.add(admin)
            db.session.commit()
            print("Admin créé.")

if __name__ == "__main__":
    seed_database()
EOF

echo -e "${BLUE}>>> Projet généré avec succès dans le dossier 'vacop-backend' !${NC}"