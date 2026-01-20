from .telemetry import telemetry_bp

def register_routes(app):
    app.register_blueprint(telemetry_bp)
