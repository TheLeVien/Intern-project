"""
services/routing.py — Ngày 4-5: gọi OSRM + tối ưu thứ tự điểm.
====================================================================
Luồng xử lý (optimize_route là hàm chính, app.py chỉ gọi hàm này):

1. Gọi OSRM /table lấy MA TRẬN khoảng cách giữa TẤT CẢ các điểm (1 lần
   request duy nhất, tránh gọi OSRM N² lần).
2. Chạy Nearest-Neighbor (lời giải nhanh, chưa tối ưu) rồi cải thiện
   bằng 2-opt (thuần Python, không cần thư viện tối ưu hóa ngoài).
   Điểm ĐẦU TIÊN người dùng nhập được coi là điểm xuất phát CỐ ĐỊNH
   (VD: kho hàng) - không bị xáo trộn vị trí.
3. Gọi OSRM /route LẦN NỮA theo đúng thứ tự đã tối ưu để lấy geometry
   (danh sách tọa độ) vẽ lên bản đồ + tổng quãng đường/thời gian thật.

Ngày 6 sẽ mở rộng `profile_for_vehicle()` để chọn OSRM profile theo
loại xe - phần còn lại của file này KHÔNG cần sửa.
"""

from __future__ import annotations

from itertools import permutations
from typing import Dict, List, Tuple, TypedDict

import requests

OSRM_BASE_URL = "https://router.project-osrm.org"
TIMEOUT_SEC = 15


class RoutingError(Exception):
    """Lỗi khi gọi OSRM (network fail, timeout, không tìm được đường...)."""


class Point(TypedDict):
    lat: float
    lng: float
    name: str


# ---------------------------------------------------------------------------
# Ngày 6: chọn "tuyến đường phù hợp với loại xe"
#
# GIỚI HẠN THỰC TẾ CẦN BIẾT: server OSRM công cộng (router.project-osrm.org)
# chỉ compile SẴN 1 profile duy nhất ("driving") - không có profile riêng
# cho xe máy/xe tải như OSRM lý thuyết hỗ trợ. Vì vậy KHÔNG THỂ đổi profile
# theo loại xe khi dùng server công cộng miễn phí này.
#
# Giải pháp thực tế đã áp dụng: gọi OSRM với `alternatives=true` để lấy
# NHIỀU tuyến khả dĩ, rồi dùng heuristic Python chọn tuyến phù hợp nhất:
# - Xe tải: ưu tiên tuyến có ÍT LẦN RẼ TRÊN MỖI KM hơn (proxy cho "đường
#   lớn, ít ngõ hẻm" - đường lớn thường có đoạn thẳng dài giữa các lần rẽ,
#   ngõ hẻm/khu dân cư thường phải rẽ liên tục).
# - Xe máy/ô tô: lấy tuyến ngắn nhất mặc định của OSRM (không cần lọc).
#
# Production thật (có ngân sách tự host OSRM): compile thêm profile riêng
# cho xe tải (VD: dựa theo car.lua nhưng thêm luật weight cao cho
# highway=residential/service) rồi đổi `profile_for_vehicle()` trả về tên
# profile đó - phần còn lại của file KHÔNG cần sửa.
# ---------------------------------------------------------------------------

def profile_for_vehicle(vehicle_type: str) -> str:
    """Map loại xe -> OSRM profile. Server công cộng chỉ có 'driving'."""
    mapping = {
        "car": "driving",
        "motorbike": "driving",
        "truck": "driving",
    }
    return mapping.get(vehicle_type, "driving")


# ---------------------------------------------------------------------------
# Bước 1: Ma trận khoảng cách (OSRM /table)
# ---------------------------------------------------------------------------

def _fetch_distance_matrix(points: List[Point], profile: str) -> List[List[float]]:
    """Trả về ma trận N x N khoảng cách (mét) giữa các điểm."""
    coords = ";".join(f"{p['lng']},{p['lat']}" for p in points)
    url = f"{OSRM_BASE_URL}/table/v1/{profile}/{coords}"

    try:
        resp = requests.get(url, params={"annotations": "distance"}, timeout=TIMEOUT_SEC)
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.Timeout as exc:
        raise RoutingError("OSRM không phản hồi (timeout) khi lấy ma trận khoảng cách.") from exc
    except requests.exceptions.ConnectionError as exc:
        raise RoutingError("Không kết nối được tới OSRM.") from exc
    except requests.exceptions.RequestException as exc:
        raise RoutingError(f"Lỗi gọi OSRM /table: {exc}") from exc
    except ValueError as exc:
        raise RoutingError(f"OSRM trả về dữ liệu không hợp lệ: {exc}") from exc

    if data.get("code") != "Ok":
        raise RoutingError(f"OSRM /table trả lỗi: {data.get('code')}")

    distances = data.get("distances")
    if distances is None or any(None in row for row in distances):
        raise RoutingError("Không tìm được đường đi giữa 1 hoặc nhiều cặp điểm.")

    return distances


# ---------------------------------------------------------------------------
# Bước 2: Nearest-Neighbor + 2-opt (thuần Python)
# ---------------------------------------------------------------------------

def _nearest_neighbor_order(distance_matrix: List[List[float]]) -> List[int]:
    """
    Lời giải ban đầu: bắt đầu từ điểm 0 (cố định), luôn đi tới điểm gần
    nhất CHƯA ghé thăm. O(n²) - đủ nhanh cho vài chục điểm.
    """
    n = len(distance_matrix)
    visited = [False] * n
    order = [0]
    visited[0] = True

    for _ in range(n - 1):
        last = order[-1]
        nearest_idx, nearest_dist = None, float("inf")
        for j in range(n):
            if not visited[j] and distance_matrix[last][j] < nearest_dist:
                nearest_idx, nearest_dist = j, distance_matrix[last][j]
        order.append(nearest_idx)
        visited[nearest_idx] = True

    return order


def _path_length(order: List[int], distance_matrix: List[List[float]]) -> float:
    return sum(distance_matrix[order[i]][order[i + 1]] for i in range(len(order) - 1))


def _two_opt(order: List[int], distance_matrix: List[List[float]]) -> List[int]:
    """
    Cải thiện `order` bằng 2-opt: thử đảo ngược từng đoạn con, giữ lại
    nếu tổng quãng đường ngắn hơn. Lặp tới khi không cải thiện được nữa.

    QUAN TRỌNG: chỉ số 0 (điểm xuất phát) LUÔN được giữ cố định ở đầu -
    vòng lặp `i` bắt đầu từ 1, không bao giờ đảo đoạn chứa vị trí 0.
    Đây là bài toán "open path" (không quay lại điểm xuất phát), khác
    TSP kinh điển (closed loop).
    """
    n = len(order)
    improved = True

    while improved:
        improved = False
        for i in range(1, n - 1):
            for j in range(i + 1, n):
                new_order = order[:i] + order[i : j + 1][::-1] + order[j + 1 :]
                if _path_length(new_order, distance_matrix) < _path_length(order, distance_matrix):
                    order = new_order
                    improved = True

    return order


def _optimize_order(distance_matrix: List[List[float]]) -> List[int]:
    n = len(distance_matrix)
    if n <= 2:
        return list(range(n))  # 1-2 điểm: không có gì để tối ưu

    initial_order = _nearest_neighbor_order(distance_matrix)
    return _two_opt(initial_order, distance_matrix)


# ---------------------------------------------------------------------------
# Bước 3: Lấy geometry tuyến đường thật theo thứ tự đã tối ưu (OSRM /route)
# ---------------------------------------------------------------------------

def _route_turn_density(route: Dict) -> float:
    """
    Số lần rẽ trên mỗi km - dùng làm proxy đánh giá "đường lớn hay đường
    nhỏ/ngõ hẻm". Số càng THẤP nghĩa là đường càng thẳng/lớn -> phù hợp
    xe tải hơn.
    """
    distance_km = route["distance"] / 1000.0
    if distance_km <= 0:
        return float("inf")

    num_turns = 0
    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            maneuver_type = step.get("maneuver", {}).get("type", "")
            if maneuver_type in ("turn", "roundabout", "merge", "fork", "end of road"):
                num_turns += 1

    return num_turns / distance_km


def _select_best_route(routes: List[Dict], vehicle_type: str) -> Dict:
    """
    Chọn 1 route trong danh sách `routes` (từ OSRM alternatives=true) theo
    loại xe. Xe tải: ưu tiên route ít rẽ/km hơn, nhưng KHÔNG chấp nhận đi
    xa hơn quá 30% so với route ngắn nhất (tránh chọn đường vòng vô lý).
    """
    if len(routes) == 1 or vehicle_type != "truck":
        return routes[0]  # OSRM luôn trả route[0] = ngắn nhất theo mặc định

    shortest_distance = min(r["distance"] for r in routes)
    max_acceptable_distance = shortest_distance * 1.3

    candidates = [r for r in routes if r["distance"] <= max_acceptable_distance]
    return min(candidates, key=_route_turn_density)


def _fetch_route_geometry(ordered_points: List[Point], profile: str, vehicle_type: str = "car") -> Dict:
    coords = ";".join(f"{p['lng']},{p['lat']}" for p in ordered_points)
    url = f"{OSRM_BASE_URL}/route/v1/{profile}/{coords}"

    # Xe tải: cần "steps" (để đếm số lần rẽ) + "alternatives" (để có nhiều
    # tuyến mà chọn) - xe máy/ô tô không cần, giữ request nhẹ như cũ.
    params = {"overview": "full", "geometries": "geojson"}
    if vehicle_type == "truck":
        params["alternatives"] = "true"
        params["steps"] = "true"

    try:
        resp = requests.get(url, params=params, timeout=TIMEOUT_SEC)
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.Timeout as exc:
        raise RoutingError("OSRM không phản hồi (timeout) khi lấy tuyến đường.") from exc
    except requests.exceptions.ConnectionError as exc:
        raise RoutingError("Không kết nối được tới OSRM.") from exc
    except requests.exceptions.RequestException as exc:
        raise RoutingError(f"Lỗi gọi OSRM /route: {exc}") from exc
    except ValueError as exc:
        raise RoutingError(f"OSRM trả về dữ liệu không hợp lệ: {exc}") from exc

    if data.get("code") != "Ok" or not data.get("routes"):
        raise RoutingError(f"OSRM /route trả lỗi: {data.get('code')}")

    route = _select_best_route(data["routes"], vehicle_type)
    # GeoJSON trả [lon, lat] - đảo thành [lat, lon] cho khớp format Leaflet.
    coordinates = [[lat, lon] for lon, lat in route["geometry"]["coordinates"]]

    return {
        "geometry": coordinates,
        "distance_km": round(route["distance"] / 1000.0, 2),
        "duration_min": round(route["duration"] / 60.0, 1),
    }


# ---------------------------------------------------------------------------
# Hàm chính - app.py chỉ cần gọi hàm này
# ---------------------------------------------------------------------------

def optimize_route(points: List[Point], vehicle_type: str = "car") -> Dict:
    """
    Tối ưu thứ tự ghé thăm `points` (points[0] = điểm xuất phát cố định),
    trả về:
    {
      "order": [0, 2, 1, 3],       # index vào mảng `points` gốc, thứ tự tối ưu
      "geometry": [[lat, lon], ...],  # vẽ polyline
      "distance_km": 12.4,
      "duration_min": 23.5,
    }
    """
    if len(points) < 2:
        raise ValueError("Cần ít nhất 2 điểm để tìm đường.")

    profile = profile_for_vehicle(vehicle_type)

    distance_matrix = _fetch_distance_matrix(points, profile)
    order = _optimize_order(distance_matrix)
    ordered_points = [points[i] for i in order]

    route_info = _fetch_route_geometry(ordered_points, profile, vehicle_type)

    return {
        "order": order,
        "geometry": route_info["geometry"],
        "distance_km": route_info["distance_km"],
        "duration_min": route_info["duration_min"],
    }


# ---------------------------------------------------------------------------
# Ngày 6 bổ sung: SO SÁNH NHIỀU THUẬT TOÁN
#
# Vẽ cùng lúc kết quả của 4 cách sắp xếp điểm lên bản đồ để CHỨNG MINH
# BẰNG SỐ LIỆU THẬT tuyến nào ngắn nhất, thay vì chỉ tin vào lý thuyết.
# ---------------------------------------------------------------------------

def _brute_force_order(distance_matrix: List[List[float]]) -> List[int]:
    """
    Thử TẤT CẢ hoán vị có thể (giữ điểm 0 cố định ở đầu) - tìm ra lời giải
    TỐI ƯU TUYỆT ĐỐI, dùng làm "đáp án đúng" để so sánh với 2-opt.

    CHỈ gọi hàm này khi n nhỏ (xem giới hạn ở compare_algorithms) - độ phức
    tạp O((n-1)!) sẽ nổ số rất nhanh với n lớn.
    """
    n = len(distance_matrix)
    if n <= 2:
        return list(range(n))

    best_order, best_cost = None, float("inf")
    for perm in permutations(range(1, n)):
        order = [0] + list(perm)
        cost = _path_length(order, distance_matrix)
        if cost < best_cost:
            best_order, best_cost = order, cost

    return best_order


# Giới hạn brute-force: (n-1)! với n-1 = 9 -> 362,880 hoán vị, vẫn chạy được
# trong ~1-2 giây bằng Python thuần. Quá ngưỡng này sẽ RẤT chậm -> bỏ qua.
_BRUTE_FORCE_MAX_REMAINING_POINTS = 9


def compare_algorithms(points: List[Point], vehicle_type: str = "car") -> Dict:
    """
    Chạy 3-4 thuật toán sắp xếp điểm khác nhau trên CÙNG bộ điểm, lấy
    geometry/quãng đường thật của từng cái (gọi OSRM riêng cho mỗi thuật
    toán) để vẽ so sánh trên bản đồ.

    Trả về:
    {
      "routes": [
        {"key": "original", "algorithm": "...", "order": [...],
         "geometry": [...], "distance_km": ..., "duration_min": ...,
         "same_as": None | "<algorithm khác có cùng thứ tự>"},
        ...
      ],
      "note": "..." | None   # VD: giải thích vì sao bỏ qua brute-force
    }
    """
    if len(points) < 2:
        raise ValueError("Cần ít nhất 2 điểm để so sánh.")

    profile = profile_for_vehicle(vehicle_type)
    distance_matrix = _fetch_distance_matrix(points, profile)
    n = len(points)

    candidates: List[Tuple[str, str, List[int]]] = []  # (key, label, order)

    candidates.append(("original", "Thứ tự nhập vào (chưa tối ưu)", list(range(n))))

    nn_order = _nearest_neighbor_order(distance_matrix)
    candidates.append(("nearest_neighbor", "Nearest-Neighbor", nn_order))

    two_opt_order = _two_opt(nn_order, distance_matrix)
    candidates.append(("two_opt", "Nearest-Neighbor + 2-opt", two_opt_order))

    note = None
    if n - 1 <= _BRUTE_FORCE_MAX_REMAINING_POINTS:
        brute_order = _brute_force_order(distance_matrix)
        candidates.append(("brute_force", "Brute-force", brute_order))
    else:
        note = (
            f"Bỏ qua Brute-force vì có {n} điểm - thử hết mọi hoán vị sẽ quá "
            f"chậm (chỉ khả thi với tối đa {_BRUTE_FORCE_MAX_REMAINING_POINTS + 1} điểm)."
        )

    results: List[Dict] = []
    seen_orders: Dict[tuple, int] = {}  # order (tuple) -> index trong `results`

    for key, label, order in candidates:
        order_key = tuple(order)

        if order_key in seen_orders:
            # 2 thuật toán ra CÙNG thứ tự -> khỏi gọi OSRM lại, tái dùng kết
            # quả đã có (vừa tiết kiệm request, vừa cho người dùng biết rõ
            # 2 thuật toán này thực chất trùng nhau trên bộ điểm này).
            ref = results[seen_orders[order_key]]
            results.append({
                "key": key, "algorithm": label, "order": order,
                "geometry": ref["geometry"],
                "distance_km": ref["distance_km"],
                "duration_min": ref["duration_min"],
                "same_as": ref["algorithm"],
            })
            continue

        ordered_points = [points[i] for i in order]
        route_info = _fetch_route_geometry(ordered_points, profile, vehicle_type="car")

        results.append({
            "key": key, "algorithm": label, "order": order,
            "geometry": route_info["geometry"],
            "distance_km": route_info["distance_km"],
            "duration_min": route_info["duration_min"],
            "same_as": None,
        })
        seen_orders[order_key] = len(results) - 1

    return {"routes": results, "note": note}
