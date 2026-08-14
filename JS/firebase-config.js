// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };