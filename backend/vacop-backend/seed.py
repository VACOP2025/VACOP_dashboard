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
