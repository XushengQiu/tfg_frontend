import { useAuth } from '../auth-context';

export default function Dashboard() {
    const { profile } = useAuth();
    return (
        <div className="dashboard">
            <header>
                <h1>Hola, {profile?.name}</h1>
                {/* botón “Crear metas”, avatar, etc. */}
            </header>
            {/* tabla metas + gráfico */}
        </div>
    );
}
