// ───────────────────────────────────────────────────────────────
// src/services/api.js
// Helper Axios con autenticación Firebase + endpoints de tu API
// ───────────────────────────────────────────────────────────────
import axios       from "axios";
import { getAuth } from "firebase/auth";

/* instancia Axios apuntando a tu backend -----------------------*/
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL  // ej. https://golife-xxxx.r.appspot.com
});

/* token Firebase → cabecera Authorization ----------------------*/
api.interceptors.request.use(async cfg => {
    const fbUser = getAuth().currentUser;
    if (fbUser) {
        const token = await fbUser.getIdToken();
        cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
});

/*─────────────────── ENDPOINTS ─────────────────────────────────*/

/* ── usuario (incluye metas + estadísticas) ────────────────────*/
export const getUserData   = ()      => api.get   ("/api/usuarios");
export const getProfile = getUserData;
export const createUser    = body    => api.post  ("/api/usuarios",  body);
export const deleteAccount = ()      => api.delete("/api/usuarios");

/* ── metas individuales ────────────────────────────────────────*/
export const getGoalById   = id      => api.get   (`/api/metas/${id}`);
export const createGoalBool= body    => api.post  ("/api/metas/bool", body);
export const createGoalNum = body    => api.post  ("/api/metas/num",  body);
export const deleteGoal    = id      => api.delete(`/api/metas/${id}`);
export const finalizeGoal  = id      => api.post  (`/api/metas/${id}/finalizar`);

/* ── accesos “comodín” (opcionales) ────────────────────────────*/
export const getGoals     = async () => (await getUserData()).data.metas;
export const getUserStats = async () => (await getUserData()).data.estadisticas;

export default api;
