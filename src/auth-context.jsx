import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    deleteUser,
    getAdditionalUserInfo,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, deleteAccount as deleteAccountAPI } from './services/api';

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(null);   // Firebase user
    const [profile, setProfile] = useState(null);   // datos de tu API
    const [loading, setLoading] = useState(true);
    const navigate              = useNavigate();

    /** escucha sesión Firebase */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            setUser(fbUser);

            if (!fbUser) {                           // no log-in
                setProfile(null);
                navigate('/login', { replace:true });
                setLoading(false);
                return;
            }

            /* ya logueado -> intenta traer su perfil */
            try {
                const { data } = await getProfile();
                setProfile(data);
            } catch {
                setProfile(null);                    // 404 si aún no existe en tu BD
            }
            setLoading(false);
        });
        return unsub;
    }, [navigate]);

    /** Google sign-in */
    const login = async () => {
        const res   = await signInWithPopup(auth, googleProvider);
        const isNew = getAdditionalUserInfo(res).isNewUser;

        if (isNew) navigate('/onboarding', { replace:true });
        else       navigate('/dashboard',  { replace:true });
    };

    /** Email/password: iniciar sesión */
    const loginEmail = async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
        // Tras login, comprobamos si tiene perfil en tu API
        try {
            await getProfile();
            navigate('/dashboard', { replace: true });
        } catch {
            // Si no existe perfil aún → llevar a Onboarding para crear (POST /api/usuarios)
            navigate('/onboarding', { replace: true });
        }
    };

    /** Email/password: crear cuenta (solo crea en Firebase, el perfil se crea en Onboarding) */
    const registerEmail = async (email, password) => {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/onboarding', { replace: true });
    };

    /** logout */
    const logout = () => signOut(auth);

    /** borrar cuenta: API → Auth */
    const deleteAccount = async () => {
        // 1) elimina en tu backend
        await deleteAccountAPI();
        // 2) elimina en Firebase Auth
        await deleteUser(auth.currentUser);
        // onAuthStateChanged se encargará de redirigir a /login
    };

    if (loading) return null;

    return (
        <AuthCtx.Provider value={{
            user,
            profile,
            login,              // Google
            loginEmail,         // Email: login
            registerEmail,      // Email: alta (luego Onboarding hace el POST /api/usuarios)
            logout,
            deleteAccount
        }}>
            {children}
        </AuthCtx.Provider>
    );
}
