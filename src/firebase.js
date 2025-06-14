import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCJKfeV5uiXRVLA9w4VYOnZecDfj2LoY",
    authDomain: "golife-f7c4b.firebaseapp.com",
    projectId: "golife-f7c4b",
    storageBucket: "golife-f7c4b.appspot.com",
    messagingSenderId: "59930871697",
    appId: "1:59930871697:web:a36d4710c28ec882a8b00d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);