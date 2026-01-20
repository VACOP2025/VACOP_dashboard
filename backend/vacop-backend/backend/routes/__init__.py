from .telemetry import bp as telemetry_bp

def register_routes(app):
    app.register_blueprint(telemetry_bp)
    # keep existing ones:
    # app.register_blueprint(auth_bp)
    # app.register_blueprint(mission_bp)
