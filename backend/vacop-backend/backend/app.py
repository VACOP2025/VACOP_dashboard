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
