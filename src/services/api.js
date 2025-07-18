import axios from 'axios';
import { auth } from '../firebase';

/* instancia pre-configurada */
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
});

/* token Firebase → header Authorization */
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/* helpers de dominio ---------------------------------- */
export const createUser    = (data) => api.post('/api/usuarios', data);   // POST
export const getProfile    = ()       => api.get ('/api/usuarios');      // GET
export const deleteAccount = ()       => api.delete('/api/usuarios');    // DELETE
/* añade más endpoints cuando los necesites               */

export default api;

console.log('API URL in runtime →', process.env.REACT_APP_API_URL);
