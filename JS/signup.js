// Initialize Firebase
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"; // Import này
import { app, auth, db } from "./firebase-config.js";

// Inputs
const signupButton = document.getElementById("signup-button");

/// Validation function for email and password
function validate(email, password) {
  if(!email.includes("@gmail.com")) {
    alert("Invalid email. Please use a Gmail address.");
    return false;
  }
  if(password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return false;
  }
  return true;
}

signupButton.addEventListener("click", async (event) => { // Thêm async ở đây
  event.preventDefault();
  const emailInput = document.getElementById("email").value;
  const passwordInput = document.getElementById("password").value;
  const nameInput = document.getElementById("name").value; // Lấy thêm thông tin tên

  if(!validate(emailInput, passwordInput)) return;

  try {
    // 2. Tạo tài khoản Auth
    const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
    const user = userCredential.user;

    // 3. Lưu thông tin vào Firestore
    // Ta dùng user.uid làm ID cho document
    await setDoc(doc(db, "users", user.uid), {
      name: nameInput,
      email: emailInput,
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTRu2G9oypy3TzwMN9e-bBF7AQCGaxuzrAq2onlLC--v_zYGGSgknOEQb2aFrh-SGJOgQbS1ZYZYSaO-_LqYQRN5tTkBgbQnkXuyPwLw5jn_5pVKnOnzwYH230hsrIwnADUkCNMYsYQBqt5oSFcyy8ybtapcsXiXfCz3-msw0elxy69xk9HIoyT4N-U53-7tnJoi5JxZadbTUK7raWirpLIvC89M4dvjdE9IPkfrmRSKHspslRn6QcfQ",
      createdAt: new Date(),
      role: "user", // Bạn có thể thêm các trường mặc định khác
      places : [] // Mảng rỗng để lưu các địa điểm sau này
    });

    alert("Đăng ký và lưu thông tin thành công!");
    window.location.href = "signin.html";

  } catch (error) {
    console.error("Lỗi:", error.message);
    alert("Có lỗi xảy ra: " + error.message);
  }
});