// src/utils/format.js
export function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export function fmtFecha(iso) {
    return new Date(iso).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function todayISO() {
    return new Date().toISOString().substring(0, 10);
}


// Si me sigue saltando el error:
// const format = { capitalize, fmtFecha, todayISO };
// export default format;
