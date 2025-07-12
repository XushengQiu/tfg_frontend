import { useState } from 'react';
import { useAuth } from '../auth-context';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
    const { user } = useAuth();
    const [name, setName]       = useState('');
    const [surname, setSurname] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        await setDoc(doc(db, 'users', user.uid), {
            name,
            surname,
            createdAt: serverTimestamp(),
        });

        navigate('/dashboard', { replace:true });
    };

    return (
        <form onSubmit={handleSubmit} style={{ margin:'2rem' }}>
            <h2>Datos del usuario</h2>
            <label>Nombre:&nbsp;
                <input value={name} onChange={e=>setName(e.target.value)} required />
            </label>
            &nbsp;&nbsp;
            <label>Apellidos:&nbsp;
                <input value={surname} onChange={e=>setSurname(e.target.value)} required />
            </label>
            &nbsp;&nbsp;
            <button type="submit">Crear</button>
        </form>
    );
}
