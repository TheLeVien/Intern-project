cur_places = []; // Danh sách các địa điểm đã lưu trong Explore sheet



document.addEventListener('DOMContentLoaded', () => {
    // --- 0. SPA SLIDER & NAVIGATION ---
    const appSlider = document.getElementById('appSlider');
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    const exploreBtn = navItems[0];
    const directionsBtn = navItems[1];
    const savedBtn = navItems[2];
    const profileBtn = navItems[3];
    const headerTitle = document.getElementById('headerTitle');
    const headerActionBtn = document.getElementById('headerActionBtn');

    const exploreSheet = document.getElementById('bottom-sheet');
    const savedSheet = document.getElementById('saved-bottom-sheet');
    const directionsSheet = document.getElementById('directions-sheet');

    function setNavActive(btn) {
        navItems.forEach(item => item.classList.remove('active'));
        if (btn) btn.classList.add('active');
    }

    function switchToMapPage(activeNavBtn = null) {
        if (appSlider) appSlider.style.transform = 'translateX(0)';
        if (headerTitle) headerTitle.textContent = 'Explore';
        setNavActive(activeNavBtn);
        setTimeout(() => map.invalidateSize(), 300);
    }

    function switchToProfilePage() {
        if (appSlider) appSlider.style.transform = 'translateX(-100vw)';
        if (headerTitle) headerTitle.textContent = 'Profile';
        setNavActive(profileBtn);
        closeAllSheets();
    }

    function closeAllSheets() {
        if (exploreSheet) { exploreSheet.classList.remove('active'); exploreSheet.classList.remove('expanded'); }
        if (savedSheet) { savedSheet.classList.remove('active'); savedSheet.classList.remove('expanded'); }
        if (directionsSheet) { directionsSheet.classList.remove('active'); directionsSheet.classList.remove('expanded'); }
    }

    // Đảm bảo trạng thái ban đầu khi load trang không bị sáng icon hay bật sheet
    setNavActive(null);
    closeAllSheets();

    function openExploreSheet() {
        closeAllSheets();
        if (exploreSheet) exploreSheet.classList.add('active');
        switchToMapPage(exploreBtn);
    }

    function closeExploreSheet() {
        if (exploreSheet) {
            exploreSheet.classList.remove('active');
            exploreSheet.classList.remove('expanded');
        }
        const content = exploreSheet?.querySelector('.sheet-content');
        if (content) content.scrollTop = 0;
        switchToMapPage(null);
    }

    function openDirectionsSheet() {
        closeAllSheets();
        if (directionsSheet) directionsSheet.classList.add('active');
        switchToMapPage(directionsBtn);
    }

    function closeDirectionsSheet() {
        if (directionsSheet) {
            directionsSheet.classList.remove('active');
            directionsSheet.classList.remove('expanded');
        }
        const content = directionsSheet?.querySelector('.sheet-content');
        if (content) content.scrollTop = 0;
        switchToMapPage(null);
    }

    function openSavedSheet() {
        closeAllSheets();
        if (savedSheet) savedSheet.classList.add('active');
        switchToMapPage(savedBtn);
    }

    function closeSavedSheet() {
        if (savedSheet) {
            savedSheet.classList.remove('active');
            savedSheet.classList.remove('expanded');
        }
        const content = savedSheet?.querySelector('.sheet-content');
        if (content) content.scrollTop = 0;
        switchToMapPage(null);
    }

    // --- DRAG TO EXPAND / CLOSE GESTURE LOGIC (CHIỀU NGANG - CẠNH PHẢI) ---
    function initSheetDrag(sheetEl, handleEl, onClose) {
        if (!sheetEl || !handleEl) return;

        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        let startWidth = 380;

        handleEl.addEventListener('pointerdown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startWidth = sheetEl.offsetWidth;
            sheetEl.style.transition = 'none';
            handleEl.setPointerCapture(e.pointerId);
        });

        handleEl.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            currentX = e.clientX - startX; // Kéo sang phải (>0), Kéo sang trái (<0)
            
            // Thay đổi độ rộng trực tiếp theo tay kéo
            const newWidth = Math.max(280, startWidth + currentX);
            sheetEl.style.width = `${newWidth}px`;
        });

        handleEl.addEventListener('pointerup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            sheetEl.style.transition = '';
            sheetEl.style.width = ''; // Trả về quản lý bằng class CSS (.expanded)

            if (currentX < -70) {
                // Kéo sang trái đủ sâu -> Đóng sheet
                sheetEl.classList.remove('expanded');
                onClose();
            } else if (currentX > 40 || (sheetEl.offsetWidth - startWidth) > 50) {
                // Kéo sang phải đủ rộng -> Mở rộng sheet
                sheetEl.classList.add('expanded');
            } else {
                // Kéo ít -> Giữ nguyên hoặc thu gọn nếu kéo lệch về trái
                if (currentX < -20) {
                    sheetEl.classList.remove('expanded');
                }
            }
            currentX = 0;
            try {
                handleEl.releasePointerCapture(e.pointerId);
            } catch (err) {}
        });

        handleEl.addEventListener('pointercancel', (e) => {
            if (!isDragging) return;
            isDragging = false;
            sheetEl.style.transition = '';
            sheetEl.style.width = '';
            currentX = 0;
        });
    }

    const exploreHandle = document.getElementById('sheet-handle'); 
    const savedHandle = document.getElementById('saved-handle');
    const directionsHandle = document.getElementById('directions-handle');

    initSheetDrag(exploreSheet, exploreHandle, closeExploreSheet);
    initSheetDrag(savedSheet, savedHandle, closeSavedSheet);
    initSheetDrag(directionsSheet, directionsHandle, closeDirectionsSheet);

    if (exploreBtn) {
        exploreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isProfile = appSlider && appSlider.style.transform.includes('-100vw');
            if (isProfile) {
                openExploreSheet();
            } else {
                if (exploreSheet && exploreSheet.classList.contains('active')) {
                    closeExploreSheet();
                } else {
                    openExploreSheet();
                }
            }
        });
    }

    if (directionsBtn) {
        directionsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isProfile = appSlider && appSlider.style.transform.includes('-100vw');
            if (isProfile) {
                openDirectionsSheet();
            } else {
                if (directionsSheet && directionsSheet.classList.contains('active')) {
                    closeDirectionsSheet();
                } else {
                    openDirectionsSheet();
                }
            }
        });
    }

    if (savedBtn) {
        savedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isProfile = appSlider && appSlider.style.transform.includes('-100vw');
            if (isProfile) {
                openSavedSheet();
            } else {
                if (savedSheet && savedSheet.classList.contains('active')) {
                    closeSavedSheet();
                } else {
                    openSavedSheet();
                }
            }
        });
    }

    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isProfile = appSlider && appSlider.style.transform.includes('-100vw');
            if (isProfile) {
                switchToMapPage(null);
                closeAllSheets();
            } else {
                switchToProfilePage();
            }
        });
    }

    if (headerActionBtn) {
        headerActionBtn.addEventListener('click', () => {
            const isProfile = appSlider && appSlider.style.transform.includes('-100vw');
            if (isProfile) {
                switchToMapPage(null);
                closeAllSheets();
            } else {
                switchToProfilePage();
            }
        });
    }

    // --- 0.5 THEME TOGGLE (SÁNG / TỐI) ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleIcon = document.getElementById('themeToggleIcon');
    const THEME_STORAGE_KEY = 'map-app-theme';

    function applyTheme(theme) {
        const isLight = theme === 'light';
        document.documentElement.classList.toggle('light', isLight);
        document.documentElement.classList.toggle('dark', !isLight);
        if (themeToggleIcon) themeToggleIcon.textContent = isLight ? 'light_mode' : 'dark_mode';
        if (themeToggleBtn) themeToggleBtn.setAttribute('aria-pressed', String(isLight));
        // Cho các hàm vẽ lại (pace badge, chart...) biết theme hiện tại đã đổi
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
        || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const nextTheme = document.documentElement.classList.contains('light') ? 'dark' : 'light';
            localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
            applyTheme(nextTheme);
        });
    }

    function currentThemeColor(cssVarName) {
        return getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
    }

    // --- 1. KHỞI TẠO BẢN ĐỒ LEAFLET & MAP LOGIC ---
    const map = L.map('map', {
        zoomControl: false 
    }).setView([11.5833, 108.9833], 13); 

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    let selectedPoints = [];
    const pointsLayer = L.layerGroup().addTo(map);
    let routeLayer = null;

    const pointsListEl = document.getElementById('points-list');
    const pointsBadgeEl = document.getElementById('points-badge');
    const optimizeBtn = document.getElementById('optimize-route-btn');
    const routeStatusEl = document.getElementById('route-status');
    const routeSummaryEl = document.getElementById('route-summary');
    const routeDistanceEl = document.getElementById('route-distance');
    const routeDurationEl = document.getElementById('route-duration');
    const routePaceItemEl = document.getElementById('route-pace-item');
    const routePaceEl = document.getElementById('route-pace');
    const congestionBtn = document.getElementById('congestion-btn');
    const congestionLegendEl = document.getElementById('congestion-legend');
    const congestionExtraTimeEl = document.getElementById('congestion-extra-time');
    const congestionLayer = L.layerGroup();
    let lastRouteDistanceKm = null;
    let lastRouteDurationMin = null;

    const vehicleChips = document.querySelectorAll('#vehicle-chips .chip-btn');
    let selectedVehicle = 'motorbike';
    const clearPointsBtn = document.getElementById('clear-points-btn');

    const batchAddToggle = document.getElementById('batch-add-toggle');
    const batchAddPanel = document.getElementById('batch-add-panel');
    const batchAddTextarea = document.getElementById('batch-add-textarea');
    const batchAddSubmit = document.getElementById('batch-add-submit');
    const batchAddStatus = document.getElementById('batch-add-status');

    const simulateBtn = document.getElementById('simulate-btn');
    let lastRouteGeometry = null;
    let vehicleMarker = null;
    let simulationFrameId = null;

    const compareBtn = document.getElementById('compare-btn');
    const compareStatusEl = document.getElementById('compare-status');
    const compareLegendEl = document.getElementById('compare-legend');
    const comparisonLayer = L.layerGroup().addTo(map);
    const compareChartWrapEl = document.getElementById('compare-chart-wrap');
    const compareChartDistanceCanvas = document.getElementById('compare-chart-distance');
    const compareChartDurationCanvas = document.getElementById('compare-chart-duration');
    let compareChartDistanceInstance = null;
    let compareChartDurationInstance = null;
    let lastCompareRoutes = null;

    const searchInput = document.querySelector('.search-input');

    if (!exploreSheet || !savedSheet || !directionsSheet) {
        console.warn('Không tìm thấy các phần tử UI cần thiết trong DOM.');
        return;
    }

    if (clearPointsBtn) {
        clearPointsBtn.addEventListener('click', () => {
            selectedPoints = [];
            renderPoints();
        });
    }

    // --- REVERSE GEOCODING & SAVE POPUP FUNCTIONALITY ---
    async function reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                return data.display_name;
            }
        } catch (error) {
            console.error("Lỗi khi lấy địa chỉ:", error);
        }
        return null;
    }

    //// <---- Render explore tab's cards ---->

    const exploreRecentsList = document.querySelector('#bottom-sheet .recents-list');

    function renderCurPlaces() {
        const exploreRecentsList = document.querySelector('#bottom-sheet .recents-list');
        if (!exploreRecentsList) return;
        
        // Xóa danh sách cũ
        exploreRecentsList.innerHTML = '';

        cur_places.forEach((place) => {
            const card = document.createElement('div');
            card.className = 'recent-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="card-icon">
                    <span class="material-symbols-outlined">location_on</span>
                </div>
                <div class="card-info">
                    <h3 class="card-title">${place.name.split(',')[0]}</h3>
                    <p class="card-subtitle">${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}</p>
                </div>
                <span class="material-symbols-outlined card-action">add_circle</span>
            `;

            // Sự kiện khi bấm vào card
            card.addEventListener('click', () => {
                // GỌI HÀM CÓ SẴN ĐỂ ĐỒNG BỘ VỚI HỆ THỐNG DIRECTIONS
                addPoint(place.lat, place.lng, place.name);
                
                // Di chuyển bản đồ đến điểm đó
                map.setView([place.lat, place.lng], 16);
                
                // Đóng sheet explore và chuyển sang tab directions (tùy chọn)
                closeExploreSheet();
                
                // Nếu bạn muốn tự động mở tab directions khi thêm điểm:
                // switchToMapPage(directionsBtn); 
                // openDirectionsSheet();
            });

            exploreRecentsList.appendChild(card);
        });
    }
    renderCurPlaces(); // Gọi lần đầu để hiển thị danh sách hiện tại

    const clearRecentsBtn = document.getElementById('clearRecentsBtn');
    clearRecentsBtn?.addEventListener('click', () => {
        cur_places = [];
        renderCurPlaces();
    });

    map.on('click', async function(e) {
        closeExploreSheet();
        closeSavedSheet();

        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Tạo khung popup hiển thị trạng thái đang tải địa chỉ
        const popupContainer = document.createElement('div');
        popupContainer.innerHTML = `
            <div style="font-family: inherit; font-size: 14px; min-width: 200px; padding: 4px;">
                <b style="color: #1f2937;">Địa điểm chọn</b><br>
                <span id="popup-address" style="color: #4b5563; font-size: 13px;">Đang tìm địa chỉ...</span><br>
                <span style="color: #9ca3af; font-size: 11px;">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</span><br>
                <button id="leaflet-save-btn" style="margin-top: 8px; width: 100%; padding: 6px 12px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">Lưu</button>
            </div>
        `;

        const saveBtn = popupContainer.querySelector('#leaflet-save-btn');
        let locationName = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        // Xử lý sự kiện nút Lưu
        saveBtn.addEventListener('click', async () => {
            // 1. Chuẩn bị dữ liệu
            const placeData = { 
                lat: lat, 
                lng: lng, 
                name: locationName 
            };

            // 2. Gọi hàm lưu vào database đã định nghĩa ở authenticate-loadinfo.js
            // Kiểm tra xem hàm có tồn tại không trước khi gọi
            if (typeof window.savePlaceToDatabase === 'function') {
                saveBtn.disabled = true; // Ngăn bấm nhiều lần
                saveBtn.textContent = "Đang lưu...";
                
                const success = await window.savePlaceToDatabase(placeData);
                
                if (success) {
                    alert(`Đã lưu thành công vào Database!\nĐịa điểm: ${locationName}`);
                    map.closePopup();
                } else {
                    saveBtn.disabled = false;
                    saveBtn.textContent = "Lưu";
                }
            } else {
                alert("Lỗi: Không tìm thấy chức năng lưu database!");
            }
        });

        // Mở popup ngay lập tức với trạng thái chờ
        L.popup()
            .setLatLng(e.latlng)
            .setContent(popupContainer)
            .openOn(map);

        // Gọi API ngầm để lấy địa chỉ chi tiết
        const address = await reverseGeocode(lat, lng);
        addPoint(e.latlng.lat, e.latlng.lng, address || locationName);
        if (address) {
            locationName = address;
            cur_places.push({ lat, lng, name: locationName });
            renderCurPlaces(); // Cập nhật lại giao diện Explore sheet
            console.log(cur_places);
            const addressSpan = popupContainer.querySelector('#popup-address');
            if (addressSpan) {
                addressSpan.textContent = address;
            }
        } else {
            const addressSpan = popupContainer.querySelector('#popup-address');
            if (addressSpan) {
                addressSpan.textContent = "Không tìm thấy tên địa chỉ chi tiết";
            }
        }
    });

    async function geocodePlace(query) {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
        }
        return null;
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (!query) return;
                searchInput.disabled = true;
                try {
                    const place = await geocodePlace(query);
                    if (place) {
                        map.setView([place.lat, place.lng], 15);
                        addPoint(place.lat, place.lng, place.name);
                        searchInput.value = '';
                        searchInput.blur();
                    } else {
                        alert("❌ Không tìm thấy vị trí này. Vui lòng kiểm tra lại từ khóa!");
                    }
                } catch (error) {
                    console.error("Lỗi khi tìm kiếm:", error);
                    alert("⚠️ Có lỗi xảy ra khi kết nối tới dịch vụ tìm kiếm!");
                } finally {
                    searchInput.disabled = false;
                }
            }
        });
    }

    function numberedIcon(n) {
        return L.divIcon({
            className: 'point-marker-icon',
            html: `<span>${n}</span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28],
        });
    }

    function addPoint(lat, lng, name) {
        const isDuplicate = selectedPoints.some(p => 
            Math.abs(p.lat - lat) < 0.0001 && 
            Math.abs(p.lng - lng) < 0.0001
        );

        if (isDuplicate) {
            return; // Dừng lại, không thêm nữa
        }
        selectedPoints.push({ lat, lng, name });
        renderPoints();
    }

    function removePoint(index) {
        selectedPoints.splice(index, 1);
        renderPoints();
    }

    function movePoint(index, direction) {
        const target = index + direction;
        if (target < 0 || target >= selectedPoints.length) return;
        [selectedPoints[index], selectedPoints[target]] = [selectedPoints[target], selectedPoints[index]];
        renderPoints();
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderMarkersAndList() {
        pointsLayer.clearLayers();
        selectedPoints.forEach((p, i) => {
            L.marker([p.lat, p.lng], { icon: numberedIcon(i + 1) })
                .addTo(pointsLayer)
                .bindPopup(`<b>Điểm ${i + 1}</b><br>${escapeHtml(p.name)}`);
        });

        if (selectedPoints.length === 0) {
            pointsListEl.innerHTML = '<p class="points-empty">Tap the map or search to add stops.</p>';
            return;
        }

        pointsListEl.innerHTML = '';
        selectedPoints.forEach((p, i) => {
            const card = document.createElement('div');
            card.className = 'recent-card';
            card.innerHTML = `
                <div class="card-icon">
                    <span class="point-card__badge">${i + 1}</span>
                </div>
                <div class="card-info">
                    <h3 class="card-title">${escapeHtml(p.name)}</h3>
                    <p class="card-subtitle">${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</p>
                </div>
                <div class="point-card__actions">
                    <button class="point-card__move" data-action="up" aria-label="Di chuyển lên" ${i === 0 ? 'disabled' : ''}>
                        <span class="material-symbols-outlined">arrow_upward</span>
                    </button>
                    <button class="point-card__move" data-action="down" aria-label="Di chuyển xuống" ${i === selectedPoints.length - 1 ? 'disabled' : ''}>
                        <span class="material-symbols-outlined">arrow_downward</span>
                    </button>
                    <button class="point-card__remove" aria-label="Xóa điểm">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            `;

            card.querySelector('[data-action="up"]').addEventListener('click', () => movePoint(i, -1));
            card.querySelector('[data-action="down"]').addEventListener('click', () => movePoint(i, 1));
            card.querySelector('.point-card__remove').addEventListener('click', () => removePoint(i));

            pointsListEl.appendChild(card);
        });
    }

    function renderPoints() {
        clearRoute();
        renderMarkersAndList();

        if (selectedPoints.length > 0) {
            pointsBadgeEl.textContent = selectedPoints.length;
            pointsBadgeEl.hidden = false;
        } else {
            pointsBadgeEl.hidden = true;
        }

        optimizeBtn.disabled = selectedPoints.length < 2;
        if (compareBtn) compareBtn.disabled = selectedPoints.length < 2;
        setRouteStatus('');
    }

    function clearRoute() {
        stopSimulation();
        if (routeLayer) {
            map.removeLayer(routeLayer);
            routeLayer = null;
        }
        if (routeSummaryEl) routeSummaryEl.hidden = true;
        if (routePaceItemEl) routePaceItemEl.hidden = true;
        if (simulateBtn) simulateBtn.hidden = true;
        if (congestionBtn) congestionBtn.hidden = true;
        lastRouteGeometry = null;
        lastRouteDistanceKm = null;
        lastRouteDurationMin = null;
        clearCongestion();
        clearComparison();
    }

    // Trực quan hoá tốc độ trung bình (khoảng cách + thời gian gộp lại) bằng
    // 1 chấm màu: xanh = nhanh/thông thoáng, cam = trung bình, đỏ = chậm.
    function updatePaceBadge(distanceKm, durationMin) {
        if (!routePaceItemEl || !routePaceEl) return;
        if (!distanceKm || !durationMin) {
            routePaceItemEl.hidden = true;
            return;
        }
        const speedKmh = distanceKm / (durationMin / 60);
        let color = 'var(--status-good)';
        let label = 'Nhanh';
        if (speedKmh < 12) {
            color = 'var(--status-bad)';
            label = 'Chậm';
        } else if (speedKmh < 22) {
            color = 'var(--status-medium)';
            label = 'Trung bình';
        }
        routePaceItemEl.style.setProperty('--pace-color', color);
        routePaceEl.textContent = `${label} · ${speedKmh.toFixed(1)} km/h`;
        routePaceItemEl.hidden = false;
    }

    function clearComparison() {
        comparisonLayer.clearLayers();
        if (compareLegendEl) {
            compareLegendEl.hidden = true;
            compareLegendEl.innerHTML = '';
        }
        if (compareStatusEl) {
            compareStatusEl.textContent = '';
            compareStatusEl.classList.remove('route-status--error');
        }
        if (compareChartDistanceInstance) {
            compareChartDistanceInstance.destroy();
            compareChartDistanceInstance = null;
        }
        if (compareChartDurationInstance) {
            compareChartDurationInstance.destroy();
            compareChartDurationInstance = null;
        }
        if (compareChartWrapEl) compareChartWrapEl.hidden = true;
        lastCompareRoutes = null;
    }

    function setRouteStatus(text, isError = false) {
        if (!routeStatusEl) return;
        routeStatusEl.textContent = text || '';
        routeStatusEl.classList.toggle('route-status--error', isError);
    }

    async function findOptimalRoute() {
        if (selectedPoints.length < 2) return;

        optimizeBtn.disabled = true;
        setRouteStatus('Đang tìm đường tối ưu…');
        clearRoute();

        try {
            const res = await fetch('/api/optimize-route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points: selectedPoints.map(p => ({ lat: p.lat, lng: p.lng, name: p.name })),
                    vehicle: selectedVehicle,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setRouteStatus(data.error || 'Có lỗi khi tìm đường.', true);
                return;
            }

            selectedPoints = data.order.map(idx => selectedPoints[idx]);
            renderMarkersAndList();

            routeLayer = L.polyline(data.geometry, {
                color: '#adc6ff',
                weight: 5,
                opacity: 0.85,
                lineJoin: 'round',
            }).addTo(map);

            map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });

            if (routeDistanceEl) routeDistanceEl.textContent = `${data.distance_km} km`;
            if (routeDurationEl) routeDurationEl.textContent = `${data.duration_min} phút`;
            if (routeSummaryEl) routeSummaryEl.hidden = false;
            updatePaceBadge(data.distance_km, data.duration_min);
            setRouteStatus('');

            lastRouteGeometry = data.geometry;
            lastRouteDistanceKm = data.distance_km;
            lastRouteDurationMin = data.duration_min;
            if (simulateBtn) simulateBtn.hidden = false;
            if (congestionBtn) congestionBtn.hidden = false;
            clearCongestion();
        } catch (err) {
            setRouteStatus('Không kết nối được tới server.', true);
        } finally {
            optimizeBtn.disabled = selectedPoints.length < 2;
        }
    }

    if (optimizeBtn) optimizeBtn.addEventListener('click', findOptimalRoute);

    vehicleChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            if (chip.classList.contains('active')) return;
            vehicleChips.forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            selectedVehicle = chip.dataset.vehicle;
            clearRoute();
            setRouteStatus('Đổi loại xe - bấm "Tìm đường tối ưu" lại.');
        });
    });

    if (batchAddToggle) {
        batchAddToggle.addEventListener('click', () => {
            if (batchAddPanel) batchAddPanel.hidden = !batchAddPanel.hidden;
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function parseCoordLine(line) {
        const match = line.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
        if (!match) return null;
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[3]);
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
        return { lat, lng, name: `Điểm ${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    }

    if (batchAddSubmit) {
        batchAddSubmit.addEventListener('click', async () => {
            const lines = batchAddTextarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length === 0) return;

            batchAddSubmit.disabled = true;
            let successCount = 0;
            const failedLines = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (batchAddStatus) batchAddStatus.textContent = `Đang xử lý ${i + 1}/${lines.length}: ${line}`;

                const coordPoint = parseCoordLine(line);
                if (coordPoint) {
                    selectedPoints.push(coordPoint);
                    successCount++;
                    continue;
                }

                try {
                    const place = await geocodePlace(line);
                    if (place) {
                        selectedPoints.push(place);
                        successCount++;
                    } else {
                        failedLines.push(line);
                    }
                } catch (err) {
                    failedLines.push(line);
                }

                if (i < lines.length - 1) await sleep(1100);
            }

            renderPoints();
            batchAddTextarea.value = '';
            batchAddSubmit.disabled = false;

            if (batchAddStatus) {
                if (failedLines.length === 0) {
                    batchAddStatus.textContent = `Đã thêm ${successCount} điểm.`;
                    if (batchAddPanel) batchAddPanel.hidden = true;
                } else {
                    batchAddStatus.textContent = `Đã thêm ${successCount}/${lines.length} điểm. Không tìm thấy: ${failedLines.join('; ')}`;
                }
            }
        });
    }

    const SIMULATION_DURATION_MS = 12000;
    const VEHICLE_EMOJI = { motorbike: '🏍️', car: '🚗', truck: '🚚' };

    function haversineKm(a, b) {
        const R = 6371;
        const dLat = (b[0] - a[0]) * Math.PI / 180;
        const dLon = (b[1] - a[1]) * Math.PI / 180;
        const lat1 = a[0] * Math.PI / 180;
        const lat2 = b[0] * Math.PI / 180;
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(h));
    }

    function buildCumulativeDistances(geometry) {
        const cumulative = [0];
        for (let i = 1; i < geometry.length; i++) {
            cumulative.push(cumulative[i - 1] + haversineKm(geometry[i - 1], geometry[i]));
        }
        return cumulative;
    }

    function interpolateAlongRoute(geometry, cumulative, targetDistanceKm) {
        const totalDistance = cumulative[cumulative.length - 1];
        if (targetDistanceKm >= totalDistance) {
            return { position: geometry[geometry.length - 1], segmentIndex: geometry.length - 1 };
        }
        let i = 1;
        while (cumulative[i] < targetDistanceKm) i++;

        const segStart = cumulative[i - 1];
        const segEnd = cumulative[i];
        const fraction = segEnd > segStart ? (targetDistanceKm - segStart) / (segEnd - segStart) : 0;

        const lat = geometry[i - 1][0] + (geometry[i][0] - geometry[i - 1][0]) * fraction;
        const lng = geometry[i - 1][1] + (geometry[i][1] - geometry[i - 1][1]) * fraction;

        return { position: [lat, lng], segmentIndex: i - 1 };
    }

    function setSimulateBtnLabel(text, iconName) {
        if (!simulateBtn) return;
        const spanText = simulateBtn.querySelector('span:last-child');
        const iconSpan = simulateBtn.querySelector('.material-symbols-outlined');
        if (spanText) spanText.textContent = text;
        if (iconSpan) iconSpan.textContent = iconName;
    }

    function stopSimulation() {
        if (simulationFrameId) {
            cancelAnimationFrame(simulationFrameId);
            simulationFrameId = null;
        }
        if (vehicleMarker) {
            map.removeLayer(vehicleMarker);
            vehicleMarker = null;
        }
        setSimulateBtnLabel('Mô phỏng xe chạy', 'play_arrow');
    }

    function startSimulation() {
        if (!lastRouteGeometry || lastRouteGeometry.length < 2) return;

        const geometry = lastRouteGeometry;
        const cumulative = buildCumulativeDistances(geometry);
        const totalDistance = cumulative[cumulative.length - 1];

        const emoji = VEHICLE_EMOJI[selectedVehicle] || '🚗';
        const icon = L.divIcon({
            className: 'vehicle-marker-icon', html: emoji, iconSize: [24, 24], iconAnchor: [12, 12],
        });
        vehicleMarker = L.marker(geometry[0], { icon }).addTo(map);
        setSimulateBtnLabel('Dừng mô phỏng', 'stop');

        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const fraction = Math.min(elapsed / SIMULATION_DURATION_MS, 1);
            const targetDistance = fraction * totalDistance;

            const { position, segmentIndex } = interpolateAlongRoute(geometry, cumulative, targetDistance);
            if (vehicleMarker) vehicleMarker.setLatLng(position);

            if (routeLayer) {
                const remaining = [position, ...geometry.slice(segmentIndex + 1)];
                routeLayer.setLatLngs(remaining);
            }

            if (fraction < 1) {
                simulationFrameId = requestAnimationFrame(tick);
            } else {
                stopSimulation();
            }
        }

        simulationFrameId = requestAnimationFrame(tick);
    }

    if (simulateBtn) {
        simulateBtn.addEventListener('click', () => {
            if (simulationFrameId) {
                stopSimulation();
                if (routeLayer && lastRouteGeometry) {
                    routeLayer.setLatLngs(lastRouteGeometry);
                }
            } else {
                startSimulation();
            }
        });
    }

    // ============================================================
    // 2. GIẢ LẬP ĐIỂM NGHẼN TRÊN TUYẾN ĐƯỜNG (POLYLINE NHIỀU MÀU)
    // ============================================================
    const CONGESTION_LEVELS = [
        { level: 'clear', color: 'var(--status-good)', weight: 5, label: 'Thông thoáng', delayFactor: 0 },
        { level: 'medium', color: 'var(--status-medium)', weight: 6, label: 'Đông đúc', delayFactor: 0.4 },
        { level: 'heavy', color: 'var(--status-bad)', weight: 7, label: 'Tắc nghẽn', delayFactor: 1.0 },
    ];
    // Trọng số xác suất: đa số đoạn đường thông thoáng, ít đoạn tắc nghẽn nặng
    const CONGESTION_WEIGHTS = [0.6, 0.28, 0.12];
    const CONGESTION_SEGMENT_COUNT = 14;

    function pickCongestionLevel() {
        const r = Math.random();
        let acc = 0;
        for (let i = 0; i < CONGESTION_WEIGHTS.length; i++) {
            acc += CONGESTION_WEIGHTS[i];
            if (r <= acc) return CONGESTION_LEVELS[i];
        }
        return CONGESTION_LEVELS[0];
    }

    function clearCongestion() {
        congestionLayer.clearLayers();
        if (map.hasLayer(congestionLayer)) map.removeLayer(congestionLayer);
        if (congestionLegendEl) congestionLegendEl.hidden = true;
        if (congestionExtraTimeEl) {
            congestionExtraTimeEl.hidden = true;
            congestionExtraTimeEl.textContent = '';
        }
        if (congestionBtn) {
            congestionBtn.classList.remove('active');
            const span = congestionBtn.querySelector('span:last-child');
            if (span) span.textContent = 'Mô phỏng điểm nghẽn';
        }
        if (routeLayer) routeLayer.setStyle({ opacity: 0.85 });
    }

    function showCongestionSimulation() {
        if (!lastRouteGeometry || lastRouteGeometry.length < 2) return;

        congestionLayer.clearLayers();
        const geometry = lastRouteGeometry;
        const segmentCount = Math.min(CONGESTION_SEGMENT_COUNT, geometry.length - 1);
        const pointsPerSegment = Math.max(1, Math.floor((geometry.length - 1) / segmentCount));

        // Thời gian nền (phút) trên mỗi km, dùng để quy đổi độ dài đoạn -> phút thêm
        const baseMinPerKm = (lastRouteDistanceKm && lastRouteDurationMin)
            ? lastRouteDurationMin / lastRouteDistanceKm
            : 0;
        let extraMinutesTotal = 0;

        for (let start = 0; start < geometry.length - 1; start += pointsPerSegment) {
            const end = Math.min(start + pointsPerSegment, geometry.length - 1);
            const segmentCoords = geometry.slice(start, end + 1);
            if (segmentCoords.length < 2) continue;

            let segmentKm = 0;
            for (let i = 1; i < segmentCoords.length; i++) {
                segmentKm += haversineKm(segmentCoords[i - 1], segmentCoords[i]);
            }

            const congestion = pickCongestionLevel();
            // Đường thông thoáng: giữ nguyên thời gian nền, không cộng thêm.
            // Đường đông đúc/tắc nghẽn: cộng thêm phút theo delayFactor của mức độ.
            extraMinutesTotal += segmentKm * baseMinPerKm * congestion.delayFactor;

            const cssVarName = congestion.level === 'clear' ? '--status-good'
                : congestion.level === 'medium' ? '--status-medium' : '--status-bad';
            L.polyline(segmentCoords, {
                color: currentThemeColor(cssVarName) || congestion.color,
                weight: congestion.weight,
                opacity: 0.9,
                lineCap: 'round',
            })
                .bindPopup(`<b>${congestion.label}</b>`)
                .addTo(congestionLayer);
        }

        // Làm mờ route gốc để đoạn màu nghẽn nổi bật hơn, không xoá hẳn.
        if (routeLayer && routeLayer.setStyle) routeLayer.setStyle({ opacity: 0.25 });
        congestionLayer.addTo(map);
        if (congestionLegendEl) congestionLegendEl.hidden = false;
        if (congestionExtraTimeEl) {
            if (extraMinutesTotal >= 0.1) {
                congestionExtraTimeEl.textContent = `⏱ Thời gian không đổi khi thông thoáng · +${extraMinutesTotal.toFixed(1)} phút thêm do đông đúc/tắc nghẽn`;
            } else {
                congestionExtraTimeEl.textContent = '⏱ Tuyến đường mô phỏng lần này khá thông thoáng, không phát sinh thời gian thêm';
            }
            congestionExtraTimeEl.hidden = false;
        }
        if (congestionBtn) {
            congestionBtn.classList.add('active');
            const span = congestionBtn.querySelector('span:last-child');
            if (span) span.textContent = 'Ẩn điểm nghẽn';
        }
    }

    if (congestionBtn) {
        congestionBtn.addEventListener('click', () => {
            if (map.hasLayer(congestionLayer)) {
                clearCongestion();
            } else {
                showCongestionSimulation();
            }
        });
    }

    const ALGORITHM_COLORS = {
        original: '#ef5b5b',
        nearest_neighbor: '#ffb74d',
        two_opt: '#adc6ff',
        brute_force: '#4caf50',
    };

    const ALGORITHM_DASH = {
        original: '6, 6',
    };

    function renderComparisonLegend(routes) {
        if (!compareLegendEl) return;
        const minDistance = Math.min(...routes.map(r => r.distance_km));

        compareLegendEl.innerHTML = '';
        routes.forEach((route) => {
            const item = document.createElement('div');
            item.className = 'compare-legend__item';
            item.dataset.key = route.key;

            const isBest = Math.abs(route.distance_km - minDistance) < 1e-6;
            const color = ALGORITHM_COLORS[route.key] || '#999999';

            item.innerHTML = `
                <span class="compare-legend__swatch" style="background-color:${color}"></span>
                <div class="compare-legend__info">
                    <div class="compare-legend__name">
                        ${escapeHtml(route.algorithm)}
                        ${isBest ? '<span class="compare-legend__best-badge">NGẮN NHẤT</span>' : ''}
                    </div>
                    <div class="compare-legend__stats">${route.distance_km} km · ${route.duration_min} phút</div>
                    ${route.same_as ? `<div class="compare-legend__same-as">= ${escapeHtml(route.same_as)}</div>` : ''}
                </div>
            `;

            item.addEventListener('click', () => {
                const layer = comparisonLayer._layerByKey && comparisonLayer._layerByKey[route.key];
                if (!layer) return;
                if (comparisonLayer.hasLayer(layer)) {
                    comparisonLayer.removeLayer(layer);
                    item.classList.add('compare-legend__item--dimmed');
                } else {
                    layer.addTo(comparisonLayer);
                    item.classList.remove('compare-legend__item--dimmed');
                }
            });

            compareLegendEl.appendChild(item);
        });

        compareLegendEl.hidden = false;
    }

    // ============================================================
    // 3. BIỂU ĐỒ SO SÁNH THUẬT TOÁN (Chart.js) — 2 biểu đồ cột riêng biệt
    // ============================================================
    function buildComparisonChart(canvas, existingInstance, routes, metric, unitLabel) {
        if (!canvas || typeof Chart === 'undefined' || !routes || routes.length === 0) return existingInstance;

        const labels = routes.map(r => r.algorithm);
        const values = routes.map(r => r[metric]);
        const colors = routes.map(r => ALGORITHM_COLORS[r.key] || '#999999');
        const gridColor = currentThemeColor('--bg-surface-variant') || 'rgba(255,255,255,0.1)';
        const textColor = currentThemeColor('--color-on-surface-variant') || '#c2c6d6';

        if (existingInstance) {
            existingInstance.destroy();
        }

        const instance = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 6,
                    maxBarThickness: 42,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.formattedValue} ${unitLabel}`,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: { color: textColor, font: { size: 10 } },
                        grid: { display: false },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                    },
                },
            },
        });

        return instance;
    }

    function renderComparisonCharts(routes) {
        if (!routes || routes.length === 0) return;
        compareChartDistanceInstance = buildComparisonChart(
            compareChartDistanceCanvas, compareChartDistanceInstance, routes, 'distance_km', 'km'
        );
        compareChartDurationInstance = buildComparisonChart(
            compareChartDurationCanvas, compareChartDurationInstance, routes, 'duration_min', 'phút'
        );
        if (compareChartWrapEl) compareChartWrapEl.hidden = false;
    }

    // Khi đổi theme sáng/tối, vẽ lại 2 chart để chữ + lưới đổi màu theo
    document.addEventListener('themechange', () => {
        if (lastCompareRoutes) renderComparisonCharts(lastCompareRoutes);
    });

    async function compareAlgorithms() {
        if (selectedPoints.length < 2) return;

        compareBtn.disabled = true;
        if (compareStatusEl) {
            compareStatusEl.textContent = 'Đang tính toán và so sánh các thuật toán…';
            compareStatusEl.classList.remove('route-status--error');
        }
        clearComparison();

        try {
            const res = await fetch('/api/compare-routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points: selectedPoints.map(p => ({ lat: p.lat, lng: p.lng, name: p.name })),
                    vehicle: selectedVehicle,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                if (compareStatusEl) {
                    compareStatusEl.textContent = data.error || 'Có lỗi khi so sánh.';
                    compareStatusEl.classList.add('route-status--error');
                }
                return;
            }

            comparisonLayer._layerByKey = {};
            data.routes.forEach((route) => {
                const color = ALGORITHM_COLORS[route.key] || '#999999';
                const layer = L.polyline(route.geometry, {
                    color,
                    weight: 4,
                    opacity: 0.75,
                    dashArray: ALGORITHM_DASH[route.key] || null,
                }).addTo(comparisonLayer);
                layer.bindPopup(`<b>${escapeHtml(route.algorithm)}</b><br>${route.distance_km} km · ${route.duration_min} phút`);
                comparisonLayer._layerByKey[route.key] = layer;
            });

            renderComparisonLegend(data.routes);
            lastCompareRoutes = data.routes;
            renderComparisonCharts(data.routes);

            if (compareStatusEl) {
                compareStatusEl.textContent = data.note || '';
            }
        } catch (err) {
            if (compareStatusEl) {
                compareStatusEl.textContent = 'Không kết nối được tới server.';
                compareStatusEl.classList.add('route-status--error');
            }
        } finally {
            if (compareBtn) compareBtn.disabled = selectedPoints.length < 2;
        }
    }

    if (compareBtn) compareBtn.addEventListener('click', compareAlgorithms);
    
    // --- THÊM VÀO TRONG DOMContentLoaded của main.js ---

    // Cập nhật hàm renderSavedPlaces trong main.js
    window.renderSavedPlaces = (places) => {
        const savedContainer = document.querySelector('#saved-bottom-sheet .sheet-content');
        if (!savedContainer) return;

        let listWrapper = savedContainer.querySelector('.locations-list');
        if (!listWrapper) {
            listWrapper = document.createElement('div');
            listWrapper.className = 'locations-list';
            savedContainer.appendChild(listWrapper);
        }
        
        listWrapper.innerHTML = ''; 

        if (!places || places.length === 0) {
            listWrapper.innerHTML = `<div style="text-align: center; padding: 30px; color: #888;">Chưa có địa điểm nào.</div>`;
            return;
        }

        places.forEach((place) => {
            const card = document.createElement('div');
            card.className = 'location-card';
            
            const thumbUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZd3mE42eeb1Agver79YxuOKcwWt-F-OozZtMQrsXJuqRTlt3oJ7XgCqSwXf3UHsVDl7RHwCvPF2MpWdm26VGC4Zo8vVh4iyR841se7VIZowfOZLA3eixW89bEEPZ9RNG0kgcZxOdT7TTxROsFpfelrfS6B1IF84mY8bUfqXmNxvpULDISbLpvWCh4mtQR5OFXWQQxWSzq1VfGQff8baoMVDd2ZyuGLjjlOKVW5U6x4kEXpY6o9OBesw';
            const title = place.name ? place.name.split(',')[0] : "Địa điểm chưa đặt tên";
            const address = `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`;

            card.innerHTML = `
                <div class="card-thumb" style="background-image: url('${thumbUrl}')"></div>
                <div class="card-details">
                    <h3 class="card-title">${title}</h3>
                    <p class="card-address">${address}</p>
                    <button aria-label="Xóa" class="delete-btn" style="background: none; border: none; cursor: pointer; color: #ef4444;">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            `;

            // 1. Xử lý sự kiện click vào thẻ để xem trên bản đồ
            card.addEventListener('click', () => {
                if (typeof map !== 'undefined') {
                    map.setView([place.lat, place.lng], 16);
                }
            });

            // 2. Xử lý sự kiện xóa (GỌI HÀM DATABASE)
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Ngăn việc click xóa lại kích hoạt sự kiện click vào card
                
                if (confirm("Bạn có chắc chắn muốn xóa địa điểm này?")) {
                    deleteBtn.disabled = true;
                    deleteBtn.textContent = "Đang xóa...";
                    
                    // Gọi hàm bên authenticate-loadinfo.js
                    const success = await window.deletePlaceFromDatabase(place);
                    
                    if (!success) {
                        deleteBtn.disabled = false;
                        deleteBtn.textContent = "delete"; // Tên icon
                    }
                }
            });

            listWrapper.appendChild(card);
        });
    };

    // Thêm hàm này vào main.js
    window.renderProfileSavedPlaces = (places) => {
        // Tìm tới container chứa phần "Temp" trong profile view của HTML
        const sectionsContainer = document.querySelector('.sections-container');
        if (!sectionsContainer) return;

        // Tìm hoặc tạo khu vực hiển thị danh sách timeline trong profile
        let timelineCard = sectionsContainer.querySelector('.timeline-card');
        if (!timelineCard) {
            const targetDiv = sectionsContainer.children[0];
            if (targetDiv) {
                timelineCard = document.createElement('div');
                timelineCard.className = 'timeline-card';
                targetDiv.appendChild(timelineCard);
            }
        }

        timelineCard.innerHTML = ''; // Xóa chữ "Temp" cũ

        if (!places || places.length === 0) {
            timelineCard.innerHTML = `
                <div style="padding: 12px; color: var(--color-on-surface-variant, #888); font-size: 14px;">
                    Chưa có địa điểm nào được lưu.
                </div>`;
            return;
        }

        // Duyệt qua mảng places theo đúng thứ tự để tạo timeline items thay thế chỗ Temp
        places.forEach((place, index) => {
            const title = place.name ? place.name.split(',')[0] : "Địa điểm chưa đặt tên";
            const coords = `Lat: ${place.lat.toFixed(4)}, Lng: ${place.lng.toFixed(4)}`;
            
            const isLast = index === places.length - 1;

            const item = document.createElement('div');
            item.className = `timeline-item ${isLast ? '' : 'pb-6'}`;
            item.style.position = 'relative';
            item.style.marginBottom = isLast ? '0' : '16px';

            item.innerHTML = `
                ${!isLast ? '<div class="timeline-line"></div>' : ''}
                <div class="timeline-badge">
                    <span class="badge-number">${index + 1}</span>
                </div>
                <div class="timeline-details" style="cursor: pointer;">
                    <h4 class="timeline-title" style="font-weight: 600; margin: 0;">${title}</h4>
                    <p style="font-size: 12px; color: var(--color-on-surface-variant, #888); margin: 4px 0 0 0;">${coords}</p>
                </div>
            `;

            // Tùy chọn: Bấm vào item profile sẽ nhảy bản đồ tới địa điểm đó
            item.querySelector('.timeline-details').addEventListener('click', () => {
                if (typeof map !== 'undefined' && place.lat && place.lng) {
                    // Chuyển về màn hình bản đồ nếu đang ở profile
                    const appSlider = document.getElementById('appSlider');
                    if (appSlider) appSlider.style.transform = 'translateX(0)';
                    const headerTitle = document.getElementById('headerTitle');
                    if (headerTitle) headerTitle.textContent = 'Explore';
                    
                    map.setView([place.lat, place.lng], 16);
                }
            });

            timelineCard.appendChild(item);
        });
    };

});

