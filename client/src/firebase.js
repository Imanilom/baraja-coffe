// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDt7kKSL2r3NAuQY6tUJK9tthxr-qB-TKM",
  authDomain: "barajacoffee-38e0c.firebaseapp.com",
  projectId: "barajacoffee-38e0c",
  storageBucket: "barajacoffee-38e0c.firebasestorage.app",
  messagingSenderId: "388953744470",
  appId: "1:388953744470:web:4a916b03514e0a156447f7",
  measurementId: "G-C1YDMK042Y"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);