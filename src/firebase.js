// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Veritabanı kullanacaksan
import { getAuth } from "firebase/auth"; // Auth kullanacaksan

const firebaseConfig = {
  apiKey: "AIzaSyAL__QdK9F_9y8lXct0XrNGUrwIJIL4Fkc",
  authDomain: "famerkezi-a0780.firebaseapp.com",
  projectId: "famerkezi-a0780",
  storageBucket: "famerkezi-a0780.firebasestorage.app",
  messagingSenderId: "225793064196",
  appId: "1:225793064196:web:be5d4a8c7a8b953ae4e451",
  measurementId: "G-EP3SQRGPZ3"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// İhtiyacın olan servisleri dışa aktar
export const db = getFirestore(app);
export const auth = getAuth(app);