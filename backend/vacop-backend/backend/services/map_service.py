import sqlite3
import zlib
import numpy as np
import matplotlib.pyplot as plt
import os
from flask import current_app

def read_pose_blob(pose_blob: bytes) -> np.ndarray:
    """RTAB-Map Node.pose: 12 float32 (3x4). Return 4x4."""
    vals = np.frombuffer(pose_blob, dtype=np.float32)
    if vals.size != 12:
        raise ValueError(f"Unexpected pose size: {vals.size} floats")
    M34 = vals.reshape(3, 4)
    T = np.eye(4, dtype=np.float32)
    T[:3, :4] = M34
    return T


def parse_scan_local_transform(scan_info_blob: bytes) -> np.ndarray:
    """RTAB-Map Data.scan_info ends with 3x4 float32 local transform (48 bytes). Return 4x4."""
    if scan_info_blob is None or len(scan_info_blob) < 48:
        return np.eye(4, dtype=np.float32)
    lt = np.frombuffer(scan_info_blob[-48:], dtype=np.float32).reshape(3, 4)
    TL = np.eye(4, dtype=np.float32)
    TL[:3, :4] = lt
    return TL


SQL_BASE = """
SELECT n.id, n.pose, d.scan, d.scan_info
FROM Node n
JOIN Data d ON d.id = n.id
WHERE d.scan IS NOT NULL AND n.pose IS NOT NULL
ORDER BY n.id
"""


def iter_xyz_map(
    db_path: str,
    limit_nodes: int | None,
    stride: int,
    max_points_per_scan: int | None,
    z_range: tuple[float, float] | None,
):
    """
    Stream scans from DB and yield transformed xyz_map (Nx3 float32) per node.
    Uses row-vector convention consistent with your original code.
    """
    con = sqlite3.connect(db_path)
    cur = con.cursor()

    sql = SQL_BASE
    params = ()
    if limit_nodes is not None:
        sql += " LIMIT ?"
        params = (limit_nodes,)

    for i, (node_id, pose_blob, scan_blob, scan_info_blob) in enumerate(cur.execute(sql, params)):
        if stride > 1 and (i % stride) != 0:
            continue

        T_map_node = read_pose_blob(pose_blob)
        T_node_scan = parse_scan_local_transform(scan_info_blob)

        raw = zlib.decompress(scan_blob)
        pts = np.frombuffer(raw, dtype=np.float32)
        if pts.size % 4 != 0:
            raise ValueError(f"Scan {node_id}: unexpected float count {pts.size} (not divisible by 4)")

        pts = pts.reshape(-1, 4)
        xyz = pts[:, :3].astype(np.float32, copy=False)

        # optional downsample (recommended for speed; occupancy grid doesn't need every point)
        if max_points_per_scan is not None and xyz.shape[0] > max_points_per_scan:
            idx = np.random.choice(xyz.shape[0], max_points_per_scan, replace=False)
            xyz = xyz[idx]

        # transform into map frame
        xyz1 = np.c_[xyz, np.ones((xyz.shape[0], 1), dtype=np.float32)]  # (N,4)
        xyz_map_h = xyz1 @ (T_node_scan.T) @ (T_map_node.T)  # (N,4)
        xyz_map = xyz_map_h[:, :3]

        # filter bad values
        m = np.isfinite(xyz_map).all(axis=1)
        xyz_map = xyz_map[m]

        # optional Z filtering (e.g. keep obstacle heights only)
        if z_range is not None and xyz_map.shape[0] > 0:
            zmin, zmax = z_range
            mz = (xyz_map[:, 2] >= zmin) & (xyz_map[:, 2] <= zmax)
            xyz_map = xyz_map[mz]

        if xyz_map.shape[0] > 0:
            yield xyz_map

    con.close()


def compute_bounds_xy(
    db_path: str,
    limit_nodes: int | None,
    stride: int,
    max_points_per_scan: int | None,
    z_range: tuple[float, float] | None,
):
    """First pass: compute min/max XY over streamed points."""
    min_x = np.inf
    min_y = np.inf
    max_x = -np.inf
    max_y = -np.inf
    total = 0

    for xyz in iter_xyz_map(db_path, limit_nodes, stride, max_points_per_scan, z_range):
        total += xyz.shape[0]
        x = xyz[:, 0]
        y = xyz[:, 1]
        min_x = min(min_x, float(np.min(x)))
        min_y = min(min_y, float(np.min(y)))
        max_x = max(max_x, float(np.max(x)))
        max_y = max(max_y, float(np.max(y)))

    if not np.isfinite([min_x, min_y, max_x, max_y]).all():
       # Default bounds if no points found, to prevent crash
        return (-10.0, -10.0, 10.0, 10.0, 0)

    return (min_x, min_y, max_x, max_y, total)


def build_occupancy_grid(
    db_path: str,
    resolution: float,
    limit_nodes: int | None = None,
    stride: int = 1,
    max_points_per_scan: int | None = None,
    z_range: tuple[float, float] | None = None,
    padding_m: float = 1.0,
    max_cells: int = 150_000_000,
):
    """
    Build occupancy grid (uint8): 1=occupied, 0=empty/unknown.
    Returns: grid (H,W), origin_x, origin_y (meters), resolution
    """
    min_x, min_y, max_x, max_y, total_pts = compute_bounds_xy(
        db_path, limit_nodes, stride, max_points_per_scan, z_range
    )

    # pad map a bit
    min_x -= padding_m
    min_y -= padding_m
    max_x += padding_m
    max_y += padding_m

    width = int(np.ceil((max_x - min_x) / resolution)) + 1
    height = int(np.ceil((max_y - min_y) / resolution)) + 1

    cells = width * height
    if cells > max_cells:
        raise RuntimeError(
            f"Grid too big: {width}x{height} = {cells:,} cells. "
            f"Increase resolution or reduce bounds (z_range/limit_nodes/stride)."
        )

    grid = np.zeros((height, width), dtype=np.uint8)

    # second pass: fill occupancy
    for xyz in iter_xyz_map(db_path, limit_nodes, stride, max_points_per_scan, z_range):
        x = xyz[:, 0]
        y = xyz[:, 1]

        ix = np.floor((x - min_x) / resolution).astype(np.int32)
        iy = np.floor((y - min_y) / resolution).astype(np.int32)

        m = (ix >= 0) & (ix < width) & (iy >= 0) & (iy < height)
        ix = ix[m]
        iy = iy[m]
        if ix.size == 0:
            continue

        grid[iy, ix] = 1

    return grid, min_x, min_y, resolution


def save_grid_png(grid: np.ndarray, out_png: str):
    """
    Save occupancy grid to PNG.
    1 (occupied) -> black, 0 -> white for easy viewing.
    """
    # Flip logic: 1 is occupied -> black (0), 0 is empty -> white (255)
    img = (1 - grid) * 255  
    # Flip vertically because matplotlib origin is bottom-left but image file origin is top-left
    # Actually build_occupancy_grid indices: ix corresponds to x, iy corresponds to y.
    # If we want map 'up' to be +y, and image 'up' is -y (row 0), we need to flip the grid rows.
    # map y=min_y -> row 0 in grid?
    # In build_occupancy_grid:
    # iy = floor((y - min_y) / res)
    # y=min_y -> iy=0. y=max_y -> iy=height.
    # So grid[0,:] corresponds to y=min_y (bottom of map).
    # grid[height-1,:] corresponds to y=max_y (top of map).
    # When saving to image, row 0 is top. So we must flip the array vertically so that
    # the top of the image corresponds to max_y.
    img_flipped = np.flipud(img)
    
    plt.imsave(out_png, img_flipped.astype(np.uint8), cmap="gray", vmin=0, vmax=255)
