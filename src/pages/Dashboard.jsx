// ───────────────────────────────────────────────────────────────
// src/pages/Dashboard.jsx
// ───────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth-context";

import {
    getProfile,
    getGoalById,        // lo seguimos usando para traer REGISTROS del detalle
    createGoalBool,
    createGoalNum,
    updateGoalBool,
    updateGoalNum,
    finalizeGoal,
    deleteGoal,
    createRecordBool,
    createRecordNum,
    deleteRecord,
} from "../services/api";

import NewGoalModal from "../components/NewGoalModal";
import EntryModal from "../components/EntryModal";
import EditGoalModal from "../components/EditGoalModal";
import GoalRow from "../components/GoalRow";
import GoalDetail from "../components/GoalDetail";
import GoalInsight from "../components/GoalInsight";
import { capitalize as cap, fmtFecha } from "../utils/format";

import "../index.css";

/* Extrae mensaje de error legible */
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

    return status
        ? `Error ${status}: ${msg || fallback || "Solicitud fallida"}`
        : msg || fallback || "Se produjo un error.";
};

export default function Dashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState(null);

    const [openNew, setOpenNew] = useState(false);
    const [entryGoal, setEntryGoal] = useState(null);
    const [editGoal, setEditGoal] = useState(null);

    const [error, setError] = useState("");
    const [isCreating, setIsCreating] = useState(false); // evitar doble click en "Crear"

    // ── Ordenación ──────────────────────────────────────────────
    const [sortKey, setSortKey] = useState(null);     // 'nombre' | 'fecha' | 'periodo' | null
    const [sortDir, setSortDir] = useState("asc");    // 'asc' | 'desc'

    const toggleSort = (key) => {
        setSortKey((prevKey) => {
            if (prevKey === key) {
                // misma columna → alterna dirección
                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                return prevKey;
            } else {
                // columna distinta → empieza asc
                setSortDir("asc");
                return key;
            }
        });
    };

    const ariaSort = (key) =>
        sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none";

    // Upsert meta en el array
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

    // Carga inicial: el backend YA trae valorObjetivo/unidad para metas Num
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getProfile();
            setGoals(data.metas || []);
            setStats(data.estadisticas || null);
        } catch (err) {
            setError(apiError(err, "No se pudieron cargar los datos."));
        } finally {
            setLoading(false);
        }
    }, []);

    // inicial + cache de Profile para volver sin refetch
    useEffect(() => {
        const cache = location.state?.dashboardCache;
        if (cache && Array.isArray(cache.goals)) {
            setGoals(cache.goals);
            setStats(cache.stats ?? null);
            setLoading(false);
            navigate(".", { replace: true, state: null });
        } else {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadData]);

    // Asegura traer REGISTROS (detalle) cuando haga falta
    const ensureGoalDetail = useCallback(
        async (goal) => {
            if (goal.registros !== undefined) return;
            try {
                const { data } = await getGoalById(goal._id); // devuelve registros + resto de meta
                upsertGoal(data);
                syncSelected(data);
            } catch (err) {
                setError(apiError(err, "No se pudo cargar el detalle de la meta."));
            }
        },
        [upsertGoal, syncSelected]
    );

    const objectiveLabel = (g) =>
        g.tipo === "Bool" ? "Boolean" : `${g.valorObjetivo ?? "-"} ${g.unidad ?? ""}`.trim();

    const createdLabel = (g) => {
        const d = Array.isArray(g.fecha) ? g.fecha[0] : g.fecha;
        return d ? fmtFecha(d) : "-";
    };

    /* -------------------- CREAR META -------------------- */
    const handleCreateGoal = async (form) => {
        if (isCreating) return;
        setIsCreating(true);

        const duracionValor = form.periodoIndef ? 1 : Number(form.periodoNum);
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
                setError("La respuesta del servidor no incluye metas.");
                setOpenNew(false);
                return;
            }

            // Reemplaza/añade metas usando sólo lo que devuelve el backend
            setGoals((prev) => {
                const map = new Map(prev.map((m) => [m._id, m]));
                for (const m of payload.metas) map.set(m._id, { ...(map.get(m._id) || {}), ...m });
                return Array.from(map.values());
            });

            if (payload.estadisticas) setStats(payload.estadisticas);
            setSelectedGoal(null);
            setOpenNew(false);
        } catch (e) {
            setError(apiError(e, "No se pudo crear la meta."));
        } finally {
            setIsCreating(false);
        }
    };

    /* -------------------- FINALIZAR META -------------------- */
    const handleFinalize = async (id) => {
        if (!window.confirm("¿Marcar esta meta como COMPLETADA?")) return;

        try {
            const res = await finalizeGoal(id);
            const metaSrv = res?.data?.meta;

            if (metaSrv) {
                upsertGoal(metaSrv);
                setSelectedGoal((sel) => (sel && sel._id === id ? metaSrv : sel));
            } else {
                // fallback optimista
                setGoals((curr) => curr.map((g) => (g._id === id ? { ...g, finalizado: true } : g)));
                setSelectedGoal((sel) => (sel && sel._id === id ? { ...sel, finalizado: true } : sel));
            }

            const statsSrv = res?.data?.estadisticasUsuario || res?.data?.estadisticas;
            if (statsSrv) setStats(statsSrv);
        } catch (e) {
            setError(apiError(e, "No se pudo finalizar la meta."));
        }
    };

    /* -------------------- ELIMINAR META -------------------- */
    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar esta meta?")) return;
        const toDelete = goals.find((g) => g._id === id);

        try {
            await deleteGoal(id);
            removeGoal(id);
            setSelectedGoal((sel) => (sel && sel._id === id ? null : sel));

            setStats((prev) => {
                const prevTotal = prev?.totalMetas ?? goals.length;
                const prevFinal =
                    prev?.totalMetasFinalizadas ?? goals.filter((g) => g.finalizado).length;

                const totalMetas = Math.max(0, prevTotal - 1);
                const totalMetasFinalizadas = Math.max(
                    0,
                    prevFinal - (toDelete?.finalizado ? 1 : 0)
                );
                const porcentajeFinalizadas =
                    totalMetas === 0 ? 0 : Math.round((totalMetasFinalizadas / totalMetas) * 100);

                return {
                    ...(prev || {}),
                    totalMetas,
                    totalMetasFinalizadas,
                    porcentajeFinalizadas,
                };
            });
        } catch (e) {
            setError(apiError(e, "No se pudo eliminar la meta."));
        }
    };

    /* -------------------- ELIMINAR REGISTRO -------------------- */
    const handleDeleteRecord = async (goalId, fechaISO) => {
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
            setError(apiError(e, "No se pudo eliminar el registro."));
        }
    };

    /* -------------------- GUARDAR REGISTRO -------------------- */
    const handleSaveEntry = async (data) => {
        if (!entryGoal) return;

        const rawCreation = Array.isArray(entryGoal.fecha)
            ? entryGoal.fecha[0]
            : entryGoal.fecha;
        const minISO = rawCreation ? String(rawCreation).slice(0, 10) : undefined;
        if (minISO && data.fecha < minISO) {
            setError("La fecha del registro no puede ser anterior a la fecha de inicio de la meta.");
            return;
        }

        const toRecord = (goalType, payload) =>
            goalType === "Bool"
                ? { fecha: payload.fecha, valorBool: payload.valorBool }
                : { fecha: payload.fecha, valorNum: Number(payload.valorNum) };

        const mergeRecordIntoMeta = (meta, reg) => {
            const regs = Array.isArray(meta.registros) ? meta.registros.slice() : [];
            const i = regs.findIndex((r) => r.fecha === reg.fecha);
            if (i >= 0) regs[i] = { ...regs[i], ...reg };
            else regs.push(reg);
            return { ...meta, registros: regs };
        };

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

            let metaFromServer = res?.data?.meta;
            if (!metaFromServer && Array.isArray(res?.data?.metas)) {
                metaFromServer = res.data.metas.find((m) => m._id === entryGoal._id);
            }

            const newReg = toRecord(entryGoal.tipo, data);
            let finalMeta;

            if (metaFromServer) {
                finalMeta = Array.isArray(metaFromServer.registros)
                    ? metaFromServer
                    : mergeRecordIntoMeta(metaFromServer, newReg);
            } else {
                const base =
                    goals.find((g) => g._id === entryGoal._id) || entryGoal || selectedGoal || {};
                finalMeta = mergeRecordIntoMeta(base, newReg);
            }

            setGoals((curr) => curr.map((g) => (g._id === finalMeta._id ? finalMeta : g)));
            setSelectedGoal((sel) => (sel && sel._id === finalMeta._id ? finalMeta : sel));
            setEntryGoal(null);
        } catch (e) {
            setError(apiError(e, "No se pudo crear el registro."));
        }
    };

    /* -------------------- EDITAR META -------------------- */
    const openEditModal = (g) => setEditGoal(g);

    const handleSaveEdit = async (form) => {
        if (!editGoal) return;

        const body = {};
        if (form.nombre?.trim() && form.nombre !== editGoal.nombre)
            body.nombre = form.nombre.trim();
        if ((form.descripcion ?? "").trim() !== (editGoal.descripcion ?? ""))
            body.descripcion = (form.descripcion ?? "").trim();

        const newIndef = form.periodoIndef;
        const newVal = newIndef ? 1 : Number(form.periodoNum);
        const newUnit = newIndef ? "Indefinido" : cap(form.periodoUnit);
        if (newUnit !== editGoal.duracionUnidad || newVal !== editGoal.duracionValor) {
            body.duracionValor = newVal;
            body.duracionUnidad = newUnit;
        }

        if (editGoal.tipo === "Num") {
            const valObj = Number(form.objetivoNum);
            if (!Number.isNaN(valObj) && valObj !== editGoal.valorObjetivo)
                body.valorObjetivo = valObj;
            if ((form.objetivoUnidad ?? "").trim() && form.objetivoUnidad !== editGoal.unidad)
                body.unidad = form.objetivoUnidad.trim();
        }

        if (Object.keys(body).length === 0) return setEditGoal(null);

        try {
            const res =
                editGoal.tipo === "Bool"
                    ? await updateGoalBool(editGoal._id, body)
                    : await updateGoalNum(editGoal._id, body);

            // actualiza localmente con lo que pediste
            const locallyUpdated = { ...editGoal, ...body };
            setGoals((curr) =>
                curr.map((g) => (g._id === editGoal._id ? { ...g, ...locallyUpdated } : g))
            );
            syncSelected(locallyUpdated);
            setEditGoal(null);

            const payload = res?.data ?? {};
            if (payload.estadisticas || payload.estadisticasUsuario) {
                setStats(payload.estadisticas ?? payload.estadisticasUsuario);
            }
            if (payload.meta) {
                upsertGoal(payload.meta);
                syncSelected(payload.meta);
            } else if (Array.isArray(payload.metas)) {
                const fromServer = payload.metas.find((m) => m._id === locallyUpdated._id);
                if (fromServer) {
                    upsertGoal(fromServer);
                    syncSelected(fromServer);
                }
            }
        } catch (e) {
            setError(apiError(e, "No se pudo actualizar la meta."));
        }
    };

    // ── Comparadores para ordenación ─────────────────────────────
    const startMillis = (g) => {
        const d = Array.isArray(g.fecha) ? g.fecha[0] : g.fecha;
        return d ? new Date(d).getTime() : 0;
    };

    const periodDays = (g) => {
        const u = String(g.duracionUnidad || "").toLowerCase();
        if (u.startsWith("indef")) return Infinity;
        const n = Number(g.duracionValor) || 0;
        const mul =
            u.startsWith("día") || u.startsWith("dia")
                ? 1
                : u.startsWith("sem")
                    ? 7
                    : u.startsWith("mes")
                        ? 30
                        : u.startsWith("año") || u.startsWith("ano")
                            ? 365
                            : 0;
        return n * mul;
    };

    const iconFor = (key) => (sortKey !== key ? "⇅" : sortDir === "asc" ? "▲" : "▼");

    // Ordenación memorizada
    const goalsSorted = useMemo(() => {
        const arr = [...goals];
        if (!sortKey) return arr;

        arr.sort((a, b) => {
            if (sortKey === "nombre") {
                const res = (a.nombre || "").localeCompare(b.nombre || "", "es", {
                    sensitivity: "base",
                });
                return sortDir === "asc" ? res : -res;
            }
            if (sortKey === "fecha") {
                const res = startMillis(a) - startMillis(b);
                return sortDir === "asc" ? res : -res;
            }
            if (sortKey === "periodo") {
                const da = periodDays(a);
                const db = periodDays(b);
                const res = da - db; // Infinity al final en asc
                return sortDir === "asc" ? res : -res; // en desc, Infinity (indef) arriba
            }
            return 0;
        });

        return arr;
    }, [goals, sortKey, sortDir]);

    // Selección por defecto: primera meta visible
    useEffect(() => {
        if (selectedGoal || goalsSorted.length === 0) return;
        const first = goalsSorted[0];
        setSelectedGoal(first);
        ensureGoalDetail(first); // traer registros si no están
    }, [goalsSorted, selectedGoal, ensureGoalDetail]);

    if (loading) return <p className="dashboard-loading">Cargando…</p>;

    const profileSnapshot = profile
        ? { _id: profile._id, nombre: profile.nombre, apellidos: profile.apellidos }
        : null;

    return (
        <div className="dashboard-wrapper">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Mis metas</h1>
                <div className="dashboard-header-right">
                    <button className="create-goal-btn" onClick={() => setOpenNew(true)}>
                        Crear meta
                    </button>
                    <button
                        className="avatar-btn"
                        onClick={() =>
                            navigate("/profile", {
                                state: { dashboardCache: { goals, stats }, profileSnapshot },
                            })
                        }
                    >
                        <img
                            className="avatar-img"
                            src={user?.photoURL || "/default-avatar.svg"}
                            alt="perfil"
                        />
                    </button>
                </div>
            </header>

            <div className="board">
                <div className="left-pane card">
                    <div className="goals-scroll">
                        <div className="goals-table-wrapper">
                            <table className="goals-table">
                                <thead>
                                <tr>
                                    <th
                                        className={`sortable-th ${sortKey === "nombre" ? "active" : ""}`}
                                        onClick={() => toggleSort("nombre")}
                                        aria-sort={ariaSort("nombre")}
                                        title="Ordenar por nombre"
                                    >
                                        Nombre <span className="sort-icons">{iconFor("nombre")}</span>
                                    </th>
                                    <th
                                        className={`sortable-th ${sortKey === "fecha" ? "active" : ""}`}
                                        onClick={() => toggleSort("fecha")}
                                        aria-sort={ariaSort("fecha")}
                                        title="Ordenar por fecha de inicio"
                                    >
                                        Fecha de inicio{" "}
                                        <span className="sort-icons">{iconFor("fecha")}</span>
                                    </th>
                                    <th
                                        className={`sortable-th ${sortKey === "periodo" ? "active" : ""}`}
                                        onClick={() => toggleSort("periodo")}
                                        aria-sort={ariaSort("periodo")}
                                        title="Ordenar por periodo"
                                    >
                                        Periodo <span className="sort-icons">{iconFor("periodo")}</span>
                                    </th>
                                    <th>Objetivo</th>
                                    <th>Acciones</th>
                                </tr>
                                </thead>
                                <tbody>
                                {goalsSorted.map((g) => (
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
                        </div>
                    </div>

                    <GoalDetail
                        goal={selectedGoal}
                        fmtFecha={fmtFecha}
                        onDeleteRecord={handleDeleteRecord}
                    />
                </div>

                <div className="right-pane">
                    <section className="user-stats card">
                        <h2 style={{ margin: "0 0 1rem 0" }}>Estadísticas</h2>
                        {stats ? (
                            <div className="stats-content">
                                <p>
                                    Total
                                    <br />
                                    <strong>{stats.totalMetas}</strong>
                                </p>
                                <p>
                                    Finalizadas
                                    <br />
                                    <strong>{stats.totalMetasFinalizadas}</strong>
                                </p>
                                <p style={{ gridColumn: "1 / -1" }}>
                                    Porcentaje finalizadas:{" "}
                                    <strong>{stats.porcentajeFinalizadas}%</strong>
                                </p>
                            </div>
                        ) : (
                            <p>—</p>
                        )}
                    </section>

                    <section className="placeholder card">
                        <GoalInsight goal={selectedGoal} />
                    </section>
                </div>
            </div>

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

            {error && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>{error}</p>
                        <button className="back-btn" onClick={() => setError("")}>
                            Volver
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
