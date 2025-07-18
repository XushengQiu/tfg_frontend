import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    deleteUser,
    getAdditionalUserInfo,
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
            } catch {                                // 404 si aún no existe en tu BD
                setProfile(null);
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
        <AuthCtx.Provider value={{ user, profile, login, logout, deleteAccount }}>
            {children}
        </AuthCtx.Provider>
    );
}
