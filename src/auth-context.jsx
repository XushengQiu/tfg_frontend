import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    deleteUser,
    reauthenticateWithPopup,
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
import { getProfile } from './services/api';

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
            } catch (err) {
                const status = err?.response?.status;
                const path   = window.location.pathname;
                setProfile(null);

                if (status === 404) {
                    // Usuario logueado pero sin perfil en tu API → Onboarding (SIN cerrar sesión)
                    if (path !== '/login' && path !== '/onboarding') {
                    navigate('/onboarding', { replace: true });
                    }
                } else if (status === 401 || status === 403) {
                    // Token inválido / sin permisos → cerrar sesión y a Login
                    try { await signOut(auth); } catch {}
                    navigate('/login', { replace: true });
                } else {
                    // 429 o 5xx o fallo de red → error transitorio, NO muevo al usuario ni cierro sesión
                }
            }
            setLoading(false);
        });
        return unsub;
    }, [navigate]);

    /** Google sign-in */
    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            const code = err?.code || '';
            if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
                await signInWithRedirect(auth, googleProvider);
                return;
            }
            alert(err?.message || 'No se pudo iniciar sesión con Google.');
            return;
        }
        try {
            await getProfile();
            navigate('/dashboard', { replace: true });
        } catch {
            navigate('/onboarding', { replace: true });
        }
    };

    useEffect(() => {
        (async () => {
            const res = await getRedirectResult(auth);
            if (!res) return;
            try {
                await getProfile();
                navigate('/dashboard', { replace: true });
            } catch {
                navigate('/onboarding', { replace: true });
            }
        })();
    }, [navigate]);

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
    const logout = async () => {
        await signOut(auth);
        setProfile(null);
        navigate('/login', { replace: true });
    };

    /** borrar cuenta: API → Auth */
    const deleteAccount = async () => {
        const u = auth.currentUser;
        try {
            if (u) {
                try {
                    await deleteUser(u);
                } catch (err) {
                    if (err?.code === 'auth/requires-recent-login') {
                        await reauthenticateWithPopup(u, googleProvider);
                        await deleteUser(auth.currentUser);
                    } else {
                        throw err;
                    }
                }
            }
        } finally {
            await signOut(auth).catch(() => {});
            setProfile(null);
            navigate('/login', { replace: true });
        }
    }

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
