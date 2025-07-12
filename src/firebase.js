import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 🔑  Lee las variables que pusiste en .env  (todas empiezan por REACT_APP_)
const firebaseConfig = {
    apiKey:            process.env.REACT_APP_FB_API_KEY,
    authDomain:        process.env.REACT_APP_FB_AUTH_DOMAIN,
    projectId:         process.env.REACT_APP_FB_PROJECT_ID,
    storageBucket:     process.env.REACT_APP_FB_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FB_MESSAGING_SENDER_ID,
    appId:             process.env.REACT_APP_FB_APP_ID,
};

// 🔧  Inicializaciones de Firebase
export const app            = initializeApp(firebaseConfig);
export const auth           = getAuth(app);
export const db             = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();