import { auth, db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Hàm đồng bộ danh sách địa điểm đã lưu vào UI (Saved sheet)
const syncSavedPlacesToUI = (places) => {
    if (typeof window.renderSavedPlaces === 'function') {
        window.renderSavedPlaces(places);
    } else {
        console.warn("Hàm renderSavedPlaces chưa được định nghĩa trong main.js");
    }
};

// Hàm đồng bộ danh sách địa điểm đã lưu vào Profile
const syncProfileSavedPlacesToUI = (places) => {
    if (typeof window.renderProfileSavedPlaces === 'function') {
        window.renderProfileSavedPlaces(places);
    } else {
        console.warn("Hàm renderProfileSavedPlaces chưa được định nghĩa trong main.js");
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            const places = userData.places || [];
            
            const nameElement = document.getElementById("userName");
            const avatarElement = document.getElementById("userAvatar");
            const placesCountElement = document.getElementById("statSaved");
            const photosCountElement = document.getElementById("statPhotos");
            const reviewsCountElement = document.getElementById("statReviews");
            
            if (nameElement) {
                nameElement.innerText = userData.name;
            }
            if (avatarElement) {
                avatarElement.src = userData.avatar;
            }
            if (placesCountElement) {
                placesCountElement.innerText = places.length;
            }

            // Đồng bộ dữ liệu ra cả 2 giao diện (Saved Sheet & Profile) khi đăng nhập
            syncSavedPlacesToUI(places);
            syncProfileSavedPlacesToUI(places);
        } else {
            console.log("Không tìm thấy dữ liệu người dùng!");
        }

        const logoutButton = document.getElementById("logoutBtn");
        if (logoutButton) {
            logoutButton.addEventListener("click", () => {
                signOut(auth).then(() => {
                    window.location.href = "signin.html";
                }).catch((error) => {
                    console.error("Lỗi đăng xuất:", error);
                });
            });
        }
    }
});

window.savePlaceToDatabase = async (placeData) => {
    if (!auth.currentUser) {
        alert("Bạn cần đăng nhập để lưu địa điểm!");
        return false;
    }
    
    try {
        const newPlace = {
            lat: placeData.lat,
            lng: placeData.lng,
            name: placeData.name,
            savedAt: new Date().toISOString()
        };

        const userRef = doc(db, "users", auth.currentUser.uid);
        
        await updateDoc(userRef, {
            places: arrayUnion(newPlace)
        });

        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const updatedPlaces = docSnap.data().places || [];
            
            // Đồng bộ UI và cập nhật số lượng Saved ngay lập tức
            syncSavedPlacesToUI(updatedPlaces);
            syncProfileSavedPlacesToUI(updatedPlaces);

            const placesCountElement = document.getElementById("statSaved");
            if (placesCountElement) {
                placesCountElement.innerText = updatedPlaces.length;
            }
        }

        return true;
    } catch (error) {
        console.error("Lỗi khi lưu vào database:", error);
        alert("Có lỗi xảy ra khi lưu!");
        return false;
    }
};

window.deletePlaceFromDatabase = async (placeData) => {
    if (!auth.currentUser) {
        alert("Bạn cần đăng nhập!");
        return false;
    }

    try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
            const userData = docSnap.data();
            let currentPlaces = userData.places || [];

            const updatedPlaces = currentPlaces.filter(p => 
                !(p.lat === placeData.lat && p.lng === placeData.lng && p.savedAt === placeData.savedAt)
            );

            await updateDoc(userRef, {
                places: updatedPlaces
            });

            // Đồng bộ UI và cập nhật lại số lượng Saved sau khi xóa
            syncSavedPlacesToUI(updatedPlaces);
            syncProfileSavedPlacesToUI(updatedPlaces);

            const placesCountElement = document.getElementById("statSaved");
            if (placesCountElement) {
                placesCountElement.innerText = updatedPlaces.length;
            }

            return true;
        }
    } catch (error) {
        console.error("Lỗi khi xóa khỏi database:", error);
        alert("Có lỗi xảy ra khi xóa!");
        return false;
    }
};