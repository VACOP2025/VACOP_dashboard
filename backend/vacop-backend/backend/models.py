from backend.extensions import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from .extensions import db

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


class RobotPosition(db.Model):
    __tablename__ = "robot_positions"

    id = db.Column(db.Integer, primary_key=True)
    robot_id = db.Column(db.String(64), nullable=False, index=True, default="robot_1")

    ts = db.Column(db.DateTime, nullable=False, index=True, default=datetime.utcnow)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)

    topic = db.Column(db.String(256), nullable=True)
    raw = db.Column(db.JSON, nullable=True)   # store the original JSON if you want

    def to_dict(self):
        return {
            "id": self.id,
            "robot_id": self.robot_id,
            "ts": self.ts.isoformat(),
            "lat": self.lat,
            "lng": self.lng,
            "topic": self.topic,
        }