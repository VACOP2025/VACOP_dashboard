from backend.app import create_app
from backend.extensions import db, bcrypt
from backend.models import User
import time
from sqlalchemy.exc import OperationalError

app = create_app()

def seed_database():
    with app.app_context():
        # Boucle de tentative de connexion (max 60s)
        for _ in range(30):
            try:
                print("Tentative de connexion à la DB...")
                db.create_all()
                if not User.query.filter_by(username='admin').first():
                    print("Création de l'admin...")
                    hashed_pw = bcrypt.generate_password_hash('vacop_admin_2026').decode('utf-8')
                    admin = User(username='admin', password_hash=hashed_pw, role='admin')
                    db.session.add(admin)
                    db.session.commit()
                    print("Admin créé.")
                return
            except OperationalError:
                print("DB pas encore prête, attente 2s...")
                time.sleep(2)

if __name__ == "__main__":
    seed_database()
