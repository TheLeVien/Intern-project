<div align="center">

#  Map Point - Ứng dụng Tìm Đường & Tối Ưu Tuyến Đi

**Web app tìm đường, tối ưu thứ tự điểm dừng và so sánh trực quan các thuật toán định tuyến trên bản đồ thật**

[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0%2B-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384?logo=chart.js&logoColor=white)](https://www.chartjs.org/)
[![OSRM](https://img.shields.io/badge/Routing-OSRM-1E88E5)](http://project-osrm.org/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Status](https://img.shields.io/badge/Status-Đang%20phát%20triển-yellow)](#-lịch-sử-thay-đổi)

</div>

---
**Link dẫn đến trang web: https://mappoint-internproject.onrender.com/**

##  Mục lục

- [Mô tả dự án](#-mô-tả-dự-án)
- [Ảnh chụp màn hình & Demo](#-ảnh-chụp-màn-hình--demo)
- [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [Phụ thuộc (Dependencies)](#-phụ-thuộc-dependencies)
- [Hỗ trợ](#-hỗ-trợ)
- [Tài liệu tham khảo](#-tài-liệu-tham-khảo)

---

##  Mô tả dự án

**Map Point** là ứng dụng web giúp người dùng chọn nhiều điểm trên bản đồ, sau đó **tự động sắp xếp lại thứ tự đi tối ưu** (bài toán kiểu TSP - Traveling Salesman Problem) để rút ngắn quãng đường/thời gian di chuyển, tương tự tính năng "tối ưu điểm dừng" trên Google Maps.

###  Mục tiêu
- Giúp người giao hàng, tài xế, người lập kế hoạch di chuyển tiết kiệm thời gian và quãng đường khi phải ghé qua nhiều địa điểm.
- Trực quan hoá rõ ràng sự khác biệt giữa các thuật toán sắp xếp điểm bằng bản đồ + biểu đồ, thay vì chỉ ra một con số khô khan.

###  Đặc điểm chính
| Tính năng | Mô tả |
|---|---|
|  Tìm & thêm điểm | Tìm kiếm địa chỉ (Nominatim) hoặc chọn trực tiếp trên bản đồ |
|  Tối ưu tuyến đường | Sắp xếp lại thứ tự điểm bằng **Nearest-Neighbor + 2-opt**, gọi OSRM lấy tuyến đường thật |
|  Chọn loại phương tiện | Ô tô / xe máy / xe tải |
|  So sánh thuật toán | So sánh **4 thuật toán** cùng lúc trên bản đồ **và** 2 biểu đồ cột (quãng đường & thời gian) |
|  Mô phỏng điểm nghẽn | Tô màu polyline theo mức độ giả lập kẹt xe (xanh/cam/đỏ) + ước tính số phút phát sinh |
|  Mô phỏng xe chạy | Xem trước hành trình bằng marker di chuyển dọc tuyến đường |
|  Sáng / Tối | Chuyển giao diện sáng-tối, lưu lựa chọn giữa các lần mở app |
|  Tài khoản | Đăng ký / đăng nhập bằng Firebase Authentication, lưu lịch sử vào Firestore |

---

##  Hướng dẫn sử dụng

### 1. Đăng ký / Đăng nhập
1. Mở trình duyệt tới `http://localhost:5000`.
2. Ở màn hình chào, chọn **Đăng ký** nếu chưa có tài khoản (nhập email + mật khẩu), hoặc **Đăng nhập** nếu đã có.
3. Sau khi đăng nhập thành công, bạn được chuyển tới màn hình bản đồ chính.

### 2. Thêm điểm cần ghé qua
Có 2 cách thêm điểm:
- **Tìm theo địa chỉ:** gõ tên địa điểm vào ô tìm kiếm (dùng Nominatim), chọn kết quả gợi ý → điểm được thêm vào danh sách.
- **Chọn trực tiếp trên bản đồ:** bấm/chạm vào vị trí mong muốn trên bản đồ → điểm mới xuất hiện kèm marker.

 Lưu ý: **điểm đầu tiên bạn thêm sẽ luôn là điểm xuất phát cố định** (ví dụ: kho hàng, nhà) — hệ thống sẽ không thay đổi vị trí của điểm này khi tối ưu.

Bạn cần **tối thiểu 2 điểm** để có thể tìm đường.

### 3. Chọn loại phương tiện
Trong panel bên dưới danh sách điểm, chọn 1 trong 3 loại xe: **Ô tô / Xe máy / Xe tải**.
- Xe tải: hệ thống sẽ ưu tiên tuyến có ít khúc cua hơn (phù hợp đường lớn, tránh ngõ hẻm).
- Ô tô / xe máy: lấy tuyến đường ngắn nhất theo mặc định.

### 4. Tìm đường tối ưu
1. Bấm nút **"Tìm đường tối ưu"**.
2. Hệ thống gọi OSRM tính khoảng cách thật giữa tất cả các điểm, chạy thuật toán Nearest-Neighbor + 2-opt để sắp xếp lại thứ tự ghé thăm sao cho tổng quãng đường ngắn nhất.
3. Tuyến đường thật (đi theo đường xá thực tế, không phải đường chim bay) được vẽ lên bản đồ.
4. Phía dưới hiển thị 2 ô kết quả:
   - 📏 **Khoảng cách** (km)
   - ⏱ **Thời gian** (phút)
   
   Kèm theo 1 chấm màu nhỏ báo **tốc độ trung bình** của tuyến (xanh = nhanh, cam = trung bình, đỏ = chậm).

### 5. Mô phỏng xe chạy
Sau khi có tuyến đường, bấm **"Mô phỏng xe chạy"** để xem 1 marker di chuyển dọc theo tuyến đường đã tối ưu — giúp hình dung trực quan hành trình thực tế trước khi khởi hành. Bấm lại để dừng mô phỏng.

### 6. Mô phỏng điểm nghẽn giao thông
Bấm **"Mô phỏng điểm nghẽn"** để xem giả lập tình trạng giao thông trên tuyến:
- Tuyến đường được chia thành nhiều đoạn nhỏ, mỗi đoạn được gán ngẫu nhiên 1 trong 3 mức độ:
  - 🟢 **Thông thoáng** — không phát sinh thời gian thêm.
  - 🟠 **Đông đúc** — cộng thêm một phần thời gian cho đoạn đó.
  - 🔴 **Tắc nghẽn** — cộng thêm nhiều thời gian hơn cho đoạn đó.
- Phía dưới hiển thị dòng chữ tổng số phút phát sinh thêm do đông đúc/tắc nghẽn (thời gian gốc của tuyến không bị thay đổi).
- Bấm lại nút để ẩn lớp mô phỏng, quay về tuyến đường bình thường.

⚠️ Đây là **mô phỏng ngẫu nhiên**, không phản ánh tình trạng giao thông thật tại thời điểm sử dụng.

### 7. So sánh thuật toán
Bấm **"So sánh thuật toán"** để xem cùng lúc kết quả của nhiều cách sắp xếp điểm khác nhau trên cùng bộ điểm bạn đã chọn:
- **Thứ tự nhập vào** — dùng làm mốc so sánh.
- **Nearest-Neighbor** — thuật toán tham lam, chạy nhanh.
- **Nearest-Neighbor + 2-opt** — thuật toán đang được dùng mặc định khi bạn bấm "Tìm đường tối ưu".
- **Brute-force** (chỉ chạy khi số điểm đủ nhỏ) — thử toàn bộ khả năng để tìm ra lời giải tối ưu tuyệt đối, dùng làm "đáp án đúng" để đối chiếu.

Kết quả hiển thị:
- Từng tuyến được vẽ bằng 1 màu riêng trên bản đồ, kèm chú thích thuật toán tương ứng.
- **2 biểu đồ cột** hiển thị song song bên dưới: 1 biểu đồ so sánh **quãng đường (km)**, 1 biểu đồ so sánh **thời gian (phút)** giữa các thuật toán — giúp thấy ngay thuật toán nào hiệu quả hơn.

### 8. Đổi giao diện Sáng / Tối
Bấm biểu tượng 🌙/☀️ ở góc trên bên phải màn hình để chuyển đổi giữa giao diện sáng và tối. Lựa chọn của bạn được ghi nhớ tự động cho lần mở app kế tiếp.

### 9. Xoá / làm lại tuyến đường
Muốn chọn lại từ đầu, xoá bớt điểm khỏi danh sách hoặc bấm nút xoá toàn bộ tuyến đường hiện tại — bản đồ và panel kết quả sẽ được đặt lại về trạng thái ban đầu.

### 10. Đăng xuất
Vào màn hình hồ sơ cá nhân (Profile), bấm **"Log out"** để thoát khỏi tài khoản hiện tại.

---

##  Phụ thuộc (Dependencies)

### Backend (Python — xem `requirements.txt`)
| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| [Flask](https://flask.palletsprojects.com/) | >=3.0.0 | Web server, phục vụ file tĩnh & API |
| [requests](https://docs.python-requests.org/) | >=2.31.0 | Gọi HTTP tới OSRM API |

### Frontend (tải qua CDN, không cần cài đặt)
| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| [Leaflet](https://leafletjs.com/) | 1.9.4 | Hiển thị bản đồ, vẽ marker/polyline |
| [Chart.js](https://www.chartjs.org/) | 4.x | Vẽ biểu đồ cột so sánh thuật toán |
| [Firebase JS SDK](https://firebase.google.com/docs/web/setup) | 10.12.0 | Xác thực người dùng & Firestore |
| [Material Symbols](https://fonts.google.com/icons) | — | Bộ icon giao diện |
| Google Fonts (Hanken Grotesk, Inter, JetBrains Mono) | — | Font chữ |

### Dịch vụ bên ngoài (external services)
| Dịch vụ | Vai trò |
|---|---|
| [OSRM Demo Server](http://project-osrm.org/) (`router.project-osrm.org`) | Tính toán tuyến đường thật, ma trận khoảng cách |
| [Nominatim](https://nominatim.org/) | Tìm kiếm địa chỉ → toạ độ |
| [OpenStreetMap Tile Server](https://www.openstreetmap.org/) | Ảnh nền bản đồ |
| [Firebase](https://firebase.google.com/) | Auth + Firestore (lưu tài khoản, lịch sử) |

---

##  Tài liệu tham khảo

- [OSRM API Documentation](http://project-osrm.org/docs/v5.24.0/api/) — chi tiết API `/route`, `/table`.
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Firebase Auth for Web](https://firebase.google.com/docs/auth/web/start)
- [Firestore Web SDK](https://firebase.google.com/docs/firestore/quickstart)
- [Thuật toán 2-opt (Wikipedia)](https://en.wikipedia.org/wiki/2-opt)
- [Bài toán người bán hàng — TSP (Wikipedia)](https://vi.wikipedia.org/wiki/B%C3%A0i_to%C3%A1n_ng%C6%B0%E1%BB%9Di_b%C3%A1n_h%C3%A0ng)
- [Nominatim Search API](https://nominatim.org/release-docs/latest/api/Search/)

---

