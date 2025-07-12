import {
    onAuthStateChanged,
    signInWithPopup,
    getAdditionalUserInfo,
} from 'firebase/auth';
import {
    doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCtx   = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(null);   // sesión Firebase Auth
    const [profile, setProfile] = useState(null);   // documento en Firestore
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    /* Escucha cambios de sesión */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            setUser(fbUser);

            if (!fbUser) {                   // ── NO logueado
                setProfile(null);
                navigate('/login', { replace:true });
                setLoading(false);
                return;
            }

            /* Intenta leer el perfil en Firestore */
            const ref  = doc(db, 'users', fbUser.uid);
            const snap = await getDoc(ref);

            if (snap.exists()) {             // ── Usuario ya tiene perfil
                setProfile(snap.data());
                navigate('/dashboard', { replace:true });
            } else {                         // ── Primera vez
                setProfile(null);
                navigate('/onboarding', { replace:true });
            }

            setLoading(false);
        });

        return () => unsub();
    }, [navigate]);

    /* ---------- Login con Google ---------- */
    const login = async () => {
        const res = await signInWithPopup(auth, googleProvider);
        const isNew = getAdditionalUserInfo(res).isNewUser;

        if (isNew)       navigate('/onboarding', { replace:true });
        else             navigate('/dashboard',  { replace:true });
    };

    const value = { user, profile, login };

    if (loading) return null;            // spinner si quieres
    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
