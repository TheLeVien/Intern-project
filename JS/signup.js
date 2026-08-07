// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHac1Q4FpSubp3yS7qrNULEaiYgiury_c",
  authDomain: "getway-e2195.firebaseapp.com",
  projectId: "getway-e2195",
  storageBucket: "getway-e2195.firebasestorage.app",
  messagingSenderId: "359705378264",
  appId: "1:359705378264:web:d0e7448afc5630005c86ad",
  measurementId: "G-FRYX8HWXCS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();

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
/// Button click event listener for signup
signupButton.addEventListener("click", (event) => {
  event.preventDefault();
  const emailInput = document.getElementById("email").value;
  const passwordInput = document.getElementById("password").value;
  const nameInput = document.getElementById("name").value;
  if(!validate(emailInput, passwordInput)) {
    return;
  }
  createUserWithEmailAndPassword(auth, emailInput, passwordInput)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    alert("User created successfully!");
    window.location.href = "signin.html"; // Redirect to login page after successful signup
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
  });

});
