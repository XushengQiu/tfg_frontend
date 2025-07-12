import { useAuth } from '../auth-context';

export default function Login() {
    const { login } = useAuth();

    return (
        <main style={{ display:'flex', flexDirection:'column', alignItems:'center', marginTop:'4rem' }}>
            <h1>Bienvenido a GoLife</h1>
            <button onClick={login} style={{ padding:'0.6rem 1.2rem', marginTop:'1rem' }}>
                Iniciar sesión con Google
            </button>
        </main>
    );
}

