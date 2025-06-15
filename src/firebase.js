import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDPwiDmO6-X5z87wWk9LU98hNCTK4m16DE",
    authDomain: "golifefrontend2.firebaseapp.com",
    projectId: "golifefrontend2",
    storageBucket: "golifefrontend2.firebasestorage.app",
    messagingSenderId: "1085325627379",
    appId: "1:1085325627379:web:8a5585d8608601dfbacc86",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);