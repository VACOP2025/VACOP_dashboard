import threading

_LOCK = threading.Lock()
_LATEST_POS = None

def set_latest_position(pos: dict):
    global _LATEST_POS
    with _LOCK:
        _LATEST_POS = pos

def get_latest_position():
    with _LOCK:
        return _LATEST_POS
