from __future__ import annotations
import os
from flask import Flask, send_from_directory, request, jsonify
from services.routing import RoutingError, compare_algorithms, optimize_route

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. BỎ static_folder và static_url_path để Flask không tự động can thiệp vào các đường dẫn gốc
app = Flask(__name__) 

# 2. Định nghĩa route riêng cho file tĩnh (CSS/JS)
@app.route('/<path:path>')
def static_files(path):
    # Nếu là CSS
    if path.startswith('CSS/'):
        return send_from_directory(BASE_DIR, path)
    # Nếu là JS
    if path.startswith('JS/'):
        return send_from_directory(BASE_DIR, path)
    # Nếu là file HTML (nằm trong thư mục HTML/)
    if path.endswith('.html'):
        return send_from_directory(os.path.join(BASE_DIR, 'HTML'), path)
    
    return "Not Found", 404

# 3. Route trang chủ
@app.route("/")
def index():
    return send_from_directory(os.path.join(BASE_DIR, "HTML"), "home.html")

# ... (Giữ nguyên các route API của bạn ở dưới)

@app.route("/api/optimize-route", methods=["POST"])
def api_optimize_route():
    data = request.get_json(silent=True) or {}
    points = data.get("points", [])
    vehicle = data.get("vehicle", "car")
    if len(points) < 2:
        return jsonify({"error": "Cần ít nhất 2 điểm để tìm đường."}), 400
    try:
        result = optimize_route(points, vehicle_type=vehicle)
    except RoutingError as exc:
        return jsonify({"error": str(exc)}), 502
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(result)

@app.route("/api/compare-routes", methods=["POST"])
def api_compare_routes():
    data = request.get_json(silent=True) or {}
    points = data.get("points", [])
    vehicle = data.get("vehicle", "car")
    if len(points) < 2:
        return jsonify({"error": "Cần ít nhất 2 điểm để so sánh."}), 400
    try:
        result = compare_algorithms(points, vehicle_type=vehicle)
    except RoutingError as exc:
        return jsonify({"error": str(exc)}), 502
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(result)

# if __name__ == "__main__":
#     app.run(debug=True, host="0.0.0.0", port=5000)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
