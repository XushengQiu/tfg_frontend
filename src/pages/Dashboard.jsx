import { useAuth } from '../auth-context';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { profile, user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="dashboard">
            <header style={{display:'flex',justifyContent:'flex-end',padding:'1rem'}}>
                <button
                    onClick={() => navigate('/profile')}
                    style={{
                        width:'42px',height:'42px',borderRadius:'50%',border:'none',
                        overflow:'hidden',cursor:'pointer',background:'#ddd'
                    }}
                >
                    <img
                        src={user?.photoURL || '/default-avatar.svg'}
                        alt="perfil"
                        style={{width:'100%',height:'100%'}}
                    />
                </button>
            </header>

            <h1 style={{paddingLeft:'1.5rem'}}>Hola, {profile?.nombre ?? profile?.name}</h1>
            {/* el resto de tu dashboard */}
        </div>
    );
}

