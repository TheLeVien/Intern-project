import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// Initialize Firebase

import { app, auth } from "./firebase-config.js";

const signinButton = document.getElementById("signin-button");

//check if email and password are valid
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

signinButton.addEventListener("click", (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (!validate(email, password)) {
    return;
  }
  signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    alert("User signed in successfully!");
    window.location.href = "main.html"; // Redirect to home page after successful signin
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    alert("Error signing in: " + errorMessage);
  });
})

