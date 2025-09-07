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

/* estado de red + reintentos seguros (GET/HEAD) */
const emit = (name, detail) => {
    try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {}
};

const RETRY_STATUSES = new Set([429, 503, 504]);
const MAX_RETRIES = 3;

api.interceptors.response.use(
    (res) => {
        emit('net:ok', {});
        return res;
    },
    async (err) => {
        const cfg = err?.config || {};
        const status = err?.response?.status;
        const method = (cfg.method || 'get').toLowerCase();

        const isNetwork = !err?.response;               // fallo de red / timeout
        const retryableStatus = status && RETRY_STATUSES.has(status);
        const retryableMethod = method === 'get' || method === 'head';

        if (retryableMethod && (retryableStatus || isNetwork)) {
            cfg.__retryCount = (cfg.__retryCount || 0) + 1;
            if (cfg.__retryCount <= MAX_RETRIES) {
                const base = 350 * Math.pow(2, cfg.__retryCount - 1);
                const jitter = Math.random() * 250;
                const delay = Math.round(base + jitter);

                emit('net:degraded', { status: status || 'network', retryIn: delay, attempt: cfg.__retryCount });

                await new Promise((r) => setTimeout(r, delay));
                return api.request(cfg); // reintento
            }
        }

        // sin más reintentos → informar estado degradado
        if (retryableStatus || isNetwork) {
            emit('net:degraded', { status: status || 'network', retryIn: null, attempt: cfg.__retryCount || 0 });
        }
        return Promise.reject(err);
    }
);

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
