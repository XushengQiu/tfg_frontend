// ───────────────────────────────────────────────────────────────
// src/pages/Dashboard.jsx
// ───────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth-context";

import {
    // lecturas
    getProfile,
    getGoalById,
    // metas
    createGoalBool,
    createGoalNum,
    updateGoalBool,
    updateGoalNum,
    finalizeGoal,
    deleteGoal,
    // registros
    createRecordBool,
    createRecordNum,
    deleteRecord,
} from "../services/api";

import NewGoalModal from "../components/NewGoalModal";
import EntryModal from "../components/EntryModal";
import EditGoalModal from "../components/EditGoalModal";
import GoalRow from "../components/GoalRow";
import GoalDetail from "../components/GoalDetail";
import { capitalize as cap, fmtFecha } from "../utils/format";

import "../index.css";

/* ------------------------------------------------------------- */
/* Helper: muestra mensaje del backend + status code si existen */
const apiError = (err, fallback) => {
    const res = err?.response;
    const status = res?.status;
    const data = res?.data;

    let msg =
        (typeof data === "string" && data) ||
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors) &&
            (typeof data.errors[0] === "string"
                ? data.errors[0]
                : data.errors[0]?.msg || data.errors[0]?.message)) ||
        res?.statusText ||
        fallback;

    if (status) return `Error ${status}: ${msg || fallback || "Solicitud fallida"}`;
    return msg || fallback || "Se produjo un error.";
};

export default function Dashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // estado base
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState(null);

    // modales
    const [openNew, setOpenNew] = useState(false);     // Nueva meta
    const [entryGoal, setEntryGoal] = useState(null);  // Entrada
    const [editGoal, setEditGoal] = useState(null);    // Editar

    // helpers de estado
    const upsertGoal = useCallback((meta) => {
        if (!meta) return;
        setGoals((curr) => {
            const i = curr.findIndex((g) => g._id === meta._id);
            if (i === -1) return [...curr, meta];
            const copy = [...curr];
            copy[i] = meta;
            return copy;
        });
    }, []);

    const removeGoal = useCallback(
        (id) => setGoals((curr) => curr.filter((g) => g._id !== id)),
        []
    );

    const syncSelected = useCallback(
        (idOrMeta) =>
            setSelectedGoal((sel) => {
                if (!sel) return sel;
                const id = typeof idOrMeta === "string" ? idOrMeta : idOrMeta._id;
                if (sel._id !== id) return sel;
                return typeof idOrMeta === "object" ? idOrMeta : null;
            }),
        []
    );

    // Completa metas Num que no traen valorObjetivo/unidad
    const withNumDetails = useCallback(
        async (metas) =>
            Promise.all(
                (metas || []).map(async (m) => {
                    if (m.tipo === "Num" && (m.valorObjetivo === undefined || m.unidad === undefined)) {
                        try {
                            const { data: det } = await getGoalById(m._id);
                            return { ...m, valorObjetivo: det.valorObjetivo, unidad: det.unidad };
                        } catch {
                            return m;
                        }
                    }
                    return m;
                })
            ),
        []
    );

    // carga inicial (con cache de navegación)
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getProfile(); // metas “básicas”
            const metasConDetalle = await withNumDetails(data.metas);
            setGoals(metasConDetalle);
            setStats(data.estadisticas);
        } catch (err) {
            alert(apiError(err, "No se pudieron cargar los datos."));
        } finally {
            setLoading(false);
        }
    }, [withNumDetails]);

    useEffect(() => {
        const cache = location.state?.dashboardCache;
        if (cache && Array.isArray(cache.goals)) {
            setGoals(cache.goals);
            setStats(cache.stats ?? null);
            setLoading(false);
            navigate(".", { replace: true, state: null }); // limpiar state
        } else {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadData]);

    // si falta registros → fetch detalle
    const ensureGoalDetail = useCallback(
        async (goal) => {
            if (goal.registros !== undefined) return;
            try {
                const { data } = await getGoalById(goal._id);
                upsertGoal(data);
                syncSelected(data);
            } catch (err) {
                alert(apiError(err, "No se pudo cargar el detalle de la meta."));
            }
        },
        [upsertGoal, syncSelected]
    );

    const objectiveLabel = (g) =>
        g.tipo === "Bool" ? "Boolean" : `${g.valorObjetivo ?? "-"} ${g.unidad ?? ""}`.trim();

    // etiqueta “Fecha de creación”
    const createdLabel = (g) => {
        const d = Array.isArray(g.fecha) ? g.fecha[0] : g.fecha;
        return d ? fmtFecha(d) : "-";
    };

    /* -------------------- CREAR META (merge fino) -------------------- */
    const handleCreateGoal = async (form) => {
        const duracionValor  = form.periodoIndef ? 1 : Number(form.periodoNum);
        const duracionUnidad = form.periodoIndef ? "Indefinido" : cap(form.periodoUnit);

        try {
            const res =
                form.tipo === "bool"
                    ? await createGoalBool({
                        nombre: form.nombre,
                        descripcion: form.descripcion,
                        fecha: form.fechaInicio,
                        duracionValor,
                        duracionUnidad,
                    })
                    : await createGoalNum({
                        nombre: form.nombre,
                        descripcion: form.descripcion,
                        fecha: form.fechaInicio,
                        duracionValor,
                        duracionUnidad,
                        valorObjetivo: Number(form.objetivoNum),
                        unidad: form.objetivoUnidad,
                    });

            const payload = res?.data ?? {};
            if (!Array.isArray(payload.metas)) {
                alert("La respuesta del servidor no incluye metas.");
                setOpenNew(false);
                return;
            }

            const merged = await Promise.all(
                payload.metas.map(async (m) => {
                    const ex = goals.find((g) => g._id === m._id);

                    if (ex) {
                        const filled =
                            m.tipo === "Num"
                                ? {
                                    ...m,
                                    valorObjetivo: m.valorObjetivo ?? ex.valorObjetivo,
                                    unidad: m.unidad ?? ex.unidad,
                                }
                                : m;
                        return { ...ex, ...filled };
                    }

                    if (
                        m.tipo === "Num" &&
                        (m.valorObjetivo === undefined || m.unidad === undefined)
                    ) {
                        try {
                            const { data: det } = await getGoalById(m._id);
                            return { ...m, valorObjetivo: det.valorObjetivo, unidad: det.unidad };
                        } catch {
                            return m;
                        }
                    }

                    return m;
                })
            );

            setGoals(merged);
            if (payload.estadisticas) setStats(payload.estadisticas);
            setSelectedGoal(null);
            setOpenNew(false);
        } catch (e) {
            alert(apiError(e, "No se pudo crear la meta."));
        }
    };

    // finalizar meta
    const handleFinalize = async (id) => {
        if (!window.confirm("¿Marcar esta meta como COMPLETADA?")) return;
        try {
            const { data } = await finalizeGoal(id);
            upsertGoal(data?.meta);
            if (data?.estadisticasUsuario) setStats(data.estadisticasUsuario);
            if (!data?.meta) await loadData();
            syncSelected(data?.meta ?? id);
        } catch (e) {
            alert(apiError(e, "No se pudo finalizar la meta."));
        }
    };

    // eliminar meta ⇒ recalcular estadísticas localmente
    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar esta meta?")) return;
        const toDelete = goals.find((g) => g._id === id);

        try {
            await deleteGoal(id);

            removeGoal(id);
            setSelectedGoal((sel) => (sel && sel._id === id ? null : sel));

            setStats((prev) => {
                const prevTotal = prev?.totalMetas ?? goals.length;
                const prevFinal = prev?.totalMetasFinalizadas ?? goals.filter((g) => g.finalizado).length;

                const totalMetas = Math.max(0, prevTotal - 1);
                const totalMetasFinalizadas = Math.max(
                    0,
                    prevFinal - (toDelete?.finalizado ? 1 : 0)
                );
                const porcentajeFinalizadas =
                    totalMetas === 0 ? 0 : Math.round((totalMetasFinalizadas / totalMetas) * 100);

                return { ...(prev || {}), totalMetas, totalMetasFinalizadas, porcentajeFinalizadas };
            });
        } catch (e) {
            alert(apiError(e, "No se pudo eliminar la meta."));
        }
    };

    // eliminar registro
    const handleDeleteRecord = async (goalId, fechaISO) => {
        // Seguridad: no borrar si la meta está finalizada
        const g = goals.find((x) => x._id === goalId);
        if (g?.finalizado) return;

        if (!window.confirm("¿Eliminar este registro?")) return;
        try {
            await deleteRecord(goalId, fechaISO);
            setGoals((curr) =>
                curr.map((goal) =>
                    goal._id === goalId
                        ? { ...goal, registros: goal.registros.filter((r) => r.fecha !== fechaISO) }
                        : goal
                )
            );
            syncSelected(goalId);
        } catch (e) {
            alert(apiError(e, "No se pudo eliminar el registro."));
        }
    };

    // Guardar registro (valida fecha mínima)
    const handleSaveEntry = async (data) => {
        if (!entryGoal) return;

        const rawCreation = Array.isArray(entryGoal.fecha) ? entryGoal.fecha[0] : entryGoal.fecha;
        const minISO = rawCreation ? String(rawCreation).slice(0, 10) : undefined;
        if (minISO && data.fecha < minISO) {
            alert("La fecha del registro no puede ser anterior a la fecha de creación de la meta.");
            return;
        }

        try {
            const res =
                entryGoal.tipo === "Bool"
                    ? await createRecordBool(entryGoal._id, {
                        fecha: data.fecha,
                        valorBool: data.valorBool,
                    })
                    : await createRecordNum(entryGoal._id, {
                        fecha: data.fecha,
                        valorNum: Number(data.valorNum),
                    });

            upsertGoal(res.data?.meta);
            if (res.data?.estadisticasUsuario) setStats(res.data.estadisticasUsuario);
            if (!res.data?.meta) await loadData();
            syncSelected(res.data?.meta ?? entryGoal._id);
            setEntryGoal(null);
        } catch (e) {
            // Aquí verás mensajes como “Ya existe un registro para esa fecha”
            alert(apiError(e, "No se pudo crear el registro."));
        }
    };

    // abrir/guardar edición
    const openEditModal = (g) => setEditGoal(g);

    const handleSaveEdit = async (form) => {
        if (!editGoal) return;

        const body = {};
        if (form.nombre?.trim() && form.nombre !== editGoal.nombre) body.nombre = form.nombre.trim();
        if ((form.descripcion ?? "").trim() !== (editGoal.descripcion ?? "")) {
            body.descripcion = (form.descripcion ?? "").trim();
        }

        const newIndef = form.periodoIndef;
        const newVal   = newIndef ? 1 : Number(form.periodoNum);
        const newUnit  = newIndef ? "Indefinido" : cap(form.periodoUnit);

        if (newUnit !== editGoal.duracionUnidad || newVal !== editGoal.duracionValor) {
            body.duracionValor  = newVal;
            body.duracionUnidad = newUnit;
        }

        if (editGoal.tipo === "Num") {
            const valObj = Number(form.objetivoNum);
            if (!Number.isNaN(valObj) && valObj !== editGoal.valorObjetivo) body.valorObjetivo = valObj;
            if ((form.objetivoUnidad ?? "").trim() && form.objetivoUnidad !== editGoal.unidad) {
                body.unidad = form.objetivoUnidad.trim();
            }
        }

        if (Object.keys(body).length === 0) return setEditGoal(null);

        try {
            const res =
                editGoal.tipo === "Bool"
                    ? await updateGoalBool(editGoal._id, body)
                    : await updateGoalNum(editGoal._id, body);

            upsertGoal(res.data?.meta);
            if (res.data?.estadisticasUsuario) setStats(res.data.estadisticasUsuario);
            if (!res.data?.meta) await loadData();
            syncSelected(res.data?.meta ?? editGoal._id);
            setEditGoal(null);
        } catch (e) {
            alert(apiError(e, "No se pudo actualizar la meta."));
        }
    };

    if (loading) return <p className="dashboard-loading">Cargando…</p>;

    return (
        <div className="dashboard-wrapper">
            {/* ---------- HEADER ---------- */}
            <header className="dashboard-header">
                <h1 className="dashboard-title">Hola, {profile?.nombre}</h1>
                <div className="dashboard-header-right">
                    <button className="create-goal-btn" onClick={() => setOpenNew(true)}>
                        Crear meta
                    </button>
                    <button
                        className="avatar-btn"
                        onClick={() => navigate("/profile", { state: { dashboardCache: { goals, stats } } })}
                    >
                        <img
                            className="avatar-img"
                            src={user?.photoURL || "/default-avatar.svg"}
                            alt="perfil"
                        />
                    </button>
                </div>
            </header>

            {/* ---------- MODALES ---------- */}
            <NewGoalModal
                open={openNew}
                onClose={() => setOpenNew(false)}
                onCreate={handleCreateGoal}
            />

            <EntryModal
                open={!!entryGoal}
                goal={entryGoal}
                onClose={() => setEntryGoal(null)}
                onSave={handleSaveEntry}
            />

            <EditGoalModal
                open={!!editGoal}
                goal={editGoal}
                onClose={() => setEditGoal(null)}
                onSave={handleSaveEdit}
            />

            {/* ---------- TABLA ---------- */}
            <main className="goals-table-wrapper">
                <table className="goals-table">
                    <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Fecha de creación</th>
                        <th>Periodo</th>
                        <th>Objetivo</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {goals.map((g) => (
                        <GoalRow
                            key={g._id}
                            goal={g}
                            createdLabel={createdLabel}
                            objectiveLabel={objectiveLabel}
                            onSelect={(goal) => {
                                setSelectedGoal((cur) => (cur?._id === goal._id ? null : goal));
                                ensureGoalDetail(goal);
                            }}
                            onEntry={(goal) => setEntryGoal(goal)}
                            onFinalize={handleFinalize}
                            onEdit={(goal) => openEditModal(goal)}
                            onDelete={handleDelete}
                        />
                    ))}
                    </tbody>
                </table>

                {/* ---------- DETALLE ---------- */}
                <GoalDetail
                    goal={selectedGoal}
                    fmtFecha={fmtFecha}
                    onDeleteRecord={handleDeleteRecord}
                />
            </main>

            {/* ---------- ESTADÍSTICAS ---------- */}
            <section className="user-stats">
                <h2 style={{ margin: "0 0 1rem 0", padding: "1rem" }}>
                    Estadísticas del usuario
                </h2>
                {stats ? (
                    <ul style={{ listStyle: "none", padding: "0 1.5rem 1.5rem 1.5rem" }}>
                        <li>Metas totales: {stats.totalMetas}</li>
                        <li>Metas activas: {stats.totalMetas - stats.totalMetasFinalizadas}</li>
                        <li>Metas finalizadas: {stats.totalMetasFinalizadas}</li>
                        <li>Porcentaje finalizadas: {stats.porcentajeFinalizadas}%</li>
                    </ul>
                ) : (
                    <p style={{ padding: "0 1.5rem 1.5rem 1.5rem" }}>—</p>
                )}
            </section>
        </div>
    );
}
