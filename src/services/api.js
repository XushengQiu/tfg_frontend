// ───────────────────────────────────────────────────────────────
// src/services/api.js
// Axios + helpers autenticados con Firebase
// ───────────────────────────────────────────────────────────────
import axios       from "axios";
import { getAuth } from "firebase/auth";

/* instancia Axios */
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
});

/* token Firebase */
api.interceptors.request.use(async (cfg) => {
    const fbUser = getAuth().currentUser;
    if (fbUser) {
        const token = await fbUser.getIdToken();
        cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
});

/* ────────── ENDPOINTS ────────── */
/* usuario ------------------------------------------------------*/
export const getUserData    = ()      => api.get   ("/api/usuarios");
export const getProfile     = getUserData;
export const createUser     = (b)     => api.post  ("/api/usuarios", b);
export const updateUser     = (b)     => api.patch ("/api/usuarios", b);
export const deleteAccount  = ()      => api.delete("/api/usuarios");

/* metas --------------------------------------------------------*/
export const getGoalById     = (id)   => api.get   (`/api/metas/${id}`);
export const createGoalBool  = (b)    => api.post  ("/api/metas/bool", b);
export const createGoalNum   = (b)    => api.post  ("/api/metas/num",  b);
export const updateGoalBool  = (id,b) => api.patch (`/api/metas/${id}`, b, { params:{ tipo:"Bool" }});
export const updateGoalNum   = (id,b) => api.patch (`/api/metas/${id}`, b, { params:{ tipo:"Num"  }});
export const deleteGoal      = (id)   => api.delete(`/api/metas/${id}`);
export const finalizeGoal    = (id)   => api.post  (`/api/metas/${id}/finalizar`);

/* registros ----------------------------------------------------*/
export const createRecordBool = (mid, body) =>
    api.post(`/api/metas/${mid}/registros`, body, { params:{ tipo:"Bool"} });

export const createRecordNum  = (mid, body) =>
    api.post(`/api/metas/${mid}/registros`, body, { params:{ tipo:"Num" } });

export const deleteRecord     = (mid, fechaISO) =>
    api.delete(`/api/metas/${mid}/registros/${fechaISO}`);

/* util ---------------------------------------------------------*/
export const getGoals     = async () => (await getUserData()).data.metas;
export const getUserStats = async () => (await getUserData()).data.estadisticas;

export default api;
