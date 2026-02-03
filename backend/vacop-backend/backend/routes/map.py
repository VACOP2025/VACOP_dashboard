from flask import Blueprint, send_file, jsonify, current_app
import os
from backend.services.map_service import build_occupancy_grid, save_grid_png

map_bp = Blueprint('map', __name__, url_prefix='/api/map')

# Cache for map metadata
start_info = {}

def get_db_path():
    # Priority: Env var > Relative path
    env_path = os.environ.get('DB_PATH')
    if env_path:
        return env_path

    # Fallback to relative path detection (Local dev)
    # map.py is in backend/routes/
    # If running from vacop-backend/, dirname is backend/routes
    # We want ../../../instance/rtabmap...
    return os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../instance/rtabmap_26_02_1.db'))

def get_static_map_path():
    return os.path.join(current_app.instance_path, 'map_occupancy.png')

def ensure_map_generated():
    global start_info
    db_path = get_db_path()
    
    # We will save the map to the instance folder used by Flask
    os.makedirs(current_app.instance_path, exist_ok=True)
    out_png = os.path.join(current_app.instance_path, 'map_occupancy.png')
    
    if not os.path.exists(out_png) or not start_info:
        if not os.path.exists(db_path):
             print(f"Advert: DB path not found at {db_path}")
             return False

        # Parameters (could be moved to config)
        res = 0.05
        padding = 1.0
        
        grid, min_x, min_y, resolution = build_occupancy_grid(
            db_path=db_path,
            resolution=res,
            limit_nodes=None,
            stride=1,
            max_points_per_scan=20000,
            padding_m=padding
        )
        
        save_grid_png(grid, out_png)
        
        # Store metadata
        # grid.shape is (height, width)
        height, width = grid.shape
        start_info = {
            "origin_x": min_x,
            "origin_y": min_y,
            "resolution": resolution,
            "width": width,
            "height": height
        }
        print(f"Map generated: {width}x{height}, origin=({min_x:.3f}, {min_y:.3f})")
    
    return True

@map_bp.route('/image', methods=['GET'])
def get_map_image():
    if ensure_map_generated():
        return send_file(os.path.join(current_app.instance_path, 'map_occupancy.png'), mimetype='image/png')
    return jsonify({"error": "Map generation failed or DB missing"}), 404

@map_bp.route('/info', methods=['GET'])
def get_map_info():
    if ensure_map_generated():
        return jsonify(start_info)
    return jsonify({"error": "Map generation failed"}), 404
