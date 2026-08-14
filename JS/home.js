import { auth, db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 1. Kiểm tra trạng thái đăng nhập NGAY KHI trang tải
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Người dùng đã đăng nhập:", user.email);
        document.getElementById("user-email").textContent = user.email;


        const docRef = doc(db, "users", user.uid);

        // 2. Lấy document từ Firestore
        const docSnap = await getDoc(docRef);

        const logoutActionBtn = document.querySelector(".logout-action-btn");
        logoutActionBtn.style.visibility = "visible";

        if (docSnap.exists()) {
            // 3. Lấy dữ liệu và gán vào thẻ HTML
            const userData = docSnap.data();
            const nameElement = document.getElementById("user-name");
            const avatarElement = document.getElementById("user-avatar");
            
            if (nameElement) {
                nameElement.innerText = userData.name; // 'name' là tên trường bạn đã lưu trong Firestore
            }
            if (avatarElement) {
                avatarElement.src = userData.avatar; // 'avatar' là trường lưu URL ảnh đại diện
            }
        }

        // Có thể đổi nội dung nút từ "START EXPLORING" thành "VÀO MAP" ở đây
        const logoutButton = document.getElementById("logout-button");
        if (logoutButton) {
            logoutButton.addEventListener("click", () => {
                signOut(auth).then(() => {
                    window.location.href = "/signin.html";
                }).catch((error) => {
                    console.error("Lỗi đăng xuất:", error);
                });
            });
        }
    } else {
        console.log("Chưa đăng nhập");
        document.getElementById("user-name").textContent = "Khách";
        document.getElementById("user-email").textContent = "Vui lòng đăng nhập";
    }
});

// 2. Xử lý nút START EXPLORING
const letgoButton = document.getElementById("letgo");

if (letgoButton) {
    letgoButton.addEventListener("click", () => {        
        // Kiểm tra lại lần nữa trước khi cho đi tiếp
        if (auth.currentUser) {
            alert("Đang chuyển hướng vào tính năng...");
            window.location.href = "/main.html"; // Chuyển trang
        } else {
            alert("Bạn cần đăng nhập để sử dụng tính năng!");
            window.location.href = "/signin.html";
        }
    });
}

const signinButton = document.getElementById("signin-button");

if (signinButton) {
    signinButton.addEventListener("click", () => {
        if(!auth.currentUser) {
            window.location.href = "/signin.html";
        }
        else {
            alert("Bạn đã đăng nhập rồi!");
        }
    });
}

const signupButton = document.getElementById("signup-button");

if (signupButton) {
    signupButton.addEventListener("click", () => {
        if(!auth.currentUser) {
            window.location.href = "/signup.html";
        }
        else {
            alert("Bạn đã đăng nhập rồi!");
        }
    });
}

const userTrigger = document.getElementById('user-menu-trigger');
const userDropdown = document.getElementById('user-dropdown');

if (userTrigger && userDropdown) {
    userTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!userDropdown.contains(e.target) && !userTrigger.contains(e.target)) {
        userDropdown.classList.add('hidden');
        }
    });
}

