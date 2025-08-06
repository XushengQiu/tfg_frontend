// ───────────────────────────────────────────────────────────────
// src/pages/Dashboard.jsx
// ───────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth-context";

import {
    /* lecturas */
    getProfile,
    getGoalById,
    /* metas */
    createGoalBool,
    createGoalNum,
    updateGoalBool,
    updateGoalNum,
    finalizeGoal,
    deleteGoal,
    /* registros */
    createRecordBool,
    createRecordNum,
    deleteRecord,
} from "../services/api";

import "../index.css";

/* helpers ----------------------------------------------------- */
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const fmtFecha = (iso) =>
    new Date(iso).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

/* ------------------------------------------------------------- */
export default function Dashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    /* estado ---------------------------------------------------- */
    const [goals,   setGoals]   = useState([]);
    const [stats,   setStats]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState(null);

    /* modal Nueva meta */
    const [openNew, setOpenNew] = useState(false);
    const emptyGoal = {
        nombre: "",
        periodoIndef: false,
        periodoNum: "",
        periodoUnit: "dias",
        tipo: "num",
        objetivoNum: "",
        objetivoUnidad: "",
        descripcion: "",
        fechaInicio: new Date().toISOString().substring(0, 10),
    };
    const [newGoal, setNewGoal] = useState(emptyGoal);

    /* modal Entrada */
    const [entryGoal, setEntryGoal] = useState(null);
    const todayISO = new Date().toISOString().substring(0, 10);
    const [entryData, setEntryData] = useState({
        fecha: todayISO,
        valorBool: null,
        valorNum: "",
    });

    /* modal Editar */
    const [editGoal, setEditGoal] = useState(null);
    const [editForm, setEditForm] = useState({
        nombre: "",
        descripcion: "",
        periodoIndef: false,
        periodoNum: "",
        periodoUnit: "dias",
        objetivoNum: "",
        objetivoUnidad: "",
    });

    /* helpers de estado ---------------------------------------- */
    const upsertGoal = useCallback(
        (meta) => {
            if (!meta) return;
            setGoals((curr) => {
                const i = curr.findIndex((g) => g._id === meta._id);
                if (i === -1) return [...curr, meta];
                const copy = [...curr];
                copy[i] = meta;
                return copy;
            });
        },
        []
    );

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

    /* carga inicial (una petición) ------------------------------ */
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getProfile(); // devuelve metas “básicas”
            let metas = data.metas;

            /* ⇣ si alguna meta Num no trae valorObjetivo/unidad los completamos */
            const metasConDetalle = await Promise.all(
                metas.map(async (m) => {
                    if (
                        m.tipo === "Num" &&
                        (m.valorObjetivo === undefined || m.unidad === undefined)
                    ) {
                        try {
                            const { data: det } = await getGoalById(m._id);
                            return { ...m, valorObjetivo: det.valorObjetivo, unidad: det.unidad };
                        } catch {
                            return m; // si falla la petición dejamos la meta tal cual
                        }
                    }
                    return m;
                })
            );

            setGoals(metasConDetalle);
            setStats(data.estadisticas);
        } catch (err) {
            console.error(err);
            alert("No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /* si al seleccionar falta la lista de registros → fetch ----- */
    const ensureGoalDetail = useCallback(
        async (goal) => {
            if (goal.registros !== undefined) return; // ya los tenemos
            try {
                const { data } = await getGoalById(goal._id);
                upsertGoal(data);
                syncSelected(data);
            } catch { /* ignorar */ }
        },
        [upsertGoal, syncSelected]
    );

    /* etiquetas ------------------------------------------------- */
    const objectiveLabel = (g) =>
        g.tipo === "Bool"
            ? "Boolean"
            : `${g.valorObjetivo ?? "-"} ${g.unidad ?? ""}`.trim();

    /* seleccionar fila ----------------------------------------- */
    const handleSelectGoal = (g) => {
        setSelectedGoal((cur) => (cur?._id === g._id ? null : g));
        ensureGoalDetail(g);
    };

    /* crear meta ------------------------------------------------ */
    const handleCreateGoal = async (e) => {
        e.preventDefault();
        const duracionValor  = newGoal.periodoIndef ? 1 : Number(newGoal.periodoNum);
        const duracionUnidad = newGoal.periodoIndef
            ? "Indefinido"
            : cap(newGoal.periodoUnit);

        try {
            const res =
                newGoal.tipo === "bool"
                    ? await createGoalBool({
                        nombre: newGoal.nombre,
                        descripcion: newGoal.descripcion,
                        fecha: newGoal.fechaInicio,
                        duracionValor,
                        duracionUnidad,
                    })
                    : await createGoalNum({
                        nombre: newGoal.nombre,
                        descripcion: newGoal.descripcion,
                        fecha: newGoal.fechaInicio,
                        duracionValor,
                        duracionUnidad,
                        valorObjetivo: Number(newGoal.objetivoNum),
                        unidad: newGoal.objetivoUnidad,
                    });

            upsertGoal(res.data?.meta);
            if (res.data?.estadisticasUsuario)
                setStats(res.data.estadisticasUsuario);

            setOpenNew(false);
            setNewGoal(emptyGoal);
        } catch {
            alert("No se pudo crear la meta.");
        }
    };

    /* finalizar meta ------------------------------------------- */
    const handleFinalize = async (id) => {
        if (!window.confirm("¿Marcar esta meta como COMPLETADA?")) return;
        try {
            const { data } = await finalizeGoal(id);
            upsertGoal(data?.meta);
            if (data?.estadisticasUsuario) setStats(data.estadisticasUsuario);
            if (!data?.meta) await loadData();      // fallback raro
            syncSelected(data?.meta ?? id);
        } catch {
            alert("No se pudo finalizar la meta.");
        }
    };

    /* eliminar meta -------------------------------------------- */
    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar esta meta?")) return;
        try {
            const { data } = await deleteGoal(id); // 200 + nuevas stats
            removeGoal(id);
            if (data?.estadisticasUsuario) setStats(data.estadisticasUsuario);
            syncSelected(id);
        } catch {
            alert("No se pudo eliminar la meta.");
        }
    };

    /* eliminar registro ---------------------------------------- */
    const handleDeleteRecord = async (goalId, fechaISO) => {
        if (!window.confirm("¿Eliminar este registro?")) return;
        try {
            await deleteRecord(goalId, fechaISO);
            setGoals((curr) =>
                curr.map((g) =>
                    g._id === goalId
                        ? { ...g, registros: g.registros.filter((r) => r.fecha !== fechaISO) }
                        : g
                )
            );
            syncSelected(goalId);
        } catch {
            alert("No se pudo eliminar el registro.");
        }
    };

    /* guardar registro ----------------------------------------- */
    const handleSaveEntry = async (e) => {
        e.preventDefault();
        if (!entryGoal) return;

        try {
            const res =
                entryGoal.tipo === "Bool"
                    ? await createRecordBool(entryGoal._id, {
                        fecha: entryData.fecha,
                        valorBool: entryData.valorBool,
                    })
                    : await createRecordNum(entryGoal._id, {
                        fecha: entryData.fecha,
                        valorNum: Number(entryData.valorNum),
                    });

            upsertGoal(res.data?.meta);
            if (res.data?.estadisticasUsuario)
                setStats(res.data.estadisticasUsuario);
            if (!res.data?.meta) await loadData();
            syncSelected(res.data?.meta ?? entryGoal._id);

            setEntryGoal(null);
            setEntryData({ fecha: todayISO, valorBool: null, valorNum: "" });
        } catch {
            alert("No se pudo guardar el registro.");
        }
    };

    /* abrir modal editar --------------------------------------- */
    const openEditModal = (g) => {
        setEditGoal(g);
        setEditForm({
            nombre: g.nombre,
            descripcion: g.descripcion ?? "",
            periodoIndef: g.duracionUnidad === "Indefinido",
            periodoNum: g.duracionUnidad === "Indefinido" ? "" : g.duracionValor,
            periodoUnit:
                g.duracionUnidad === "Indefinido"
                    ? "dias"
                    : g.duracionUnidad.toLowerCase(),
            objetivoNum: g.tipo === "Num" ? g.valorObjetivo : "",
            objetivoUnidad: g.tipo === "Num" ? g.unidad : "",
        });
    };

    /* guardar edición ----------------------------------------- */
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editGoal) return;

        const body = {};
        if (editForm.nombre.trim() && editForm.nombre !== editGoal.nombre)
            body.nombre = editForm.nombre.trim();
        if (editForm.descripcion.trim() !== (editGoal.descripcion ?? ""))
            body.descripcion = editForm.descripcion.trim();

        const newIndef = editForm.periodoIndef;
        const newVal   = newIndef ? 1 : Number(editForm.periodoNum);
        const newUnit  = newIndef ? "Indefinido" : cap(editForm.periodoUnit);

        if (
            newUnit !== editGoal.duracionUnidad ||
            newVal  !== editGoal.duracionValor
        ) {
            body.duracionValor  = newVal;
            body.duracionUnidad = newUnit;
        }

        if (editGoal.tipo === "Num") {
            const valObj = Number(editForm.objetivoNum);
            if (!Number.isNaN(valObj) && valObj !== editGoal.valorObjetivo)
                body.valorObjetivo = valObj;
            if (
                editForm.objetivoUnidad.trim() &&
                editForm.objetivoUnidad !== editGoal.unidad
            )
                body.unidad = editForm.objetivoUnidad.trim();
        }

        if (Object.keys(body).length === 0) return setEditGoal(null);

        try {
            const res =
                editGoal.tipo === "Bool"
                    ? await updateGoalBool(editGoal._id, body)
                    : await updateGoalNum(editGoal._id, body);

            upsertGoal(res.data?.meta);
            if (res.data?.estadisticasUsuario)
                setStats(res.data.estadisticasUsuario);
            if (!res.data?.meta) await loadData();
            syncSelected(res.data?.meta ?? editGoal._id);

            setEditGoal(null);
        } catch {
            alert("No se pudo actualizar la meta.");
        }
    };

    /* fila de la tabla ---------------------------------------- */
    const GoalRow = ({ goal }) => (
        <tr
            className={`goal-row ${goal.finalizado ? "goal-row-finalizada" : ""}`}
            onClick={() => handleSelectGoal(goal)}
        >
            <td className="goal-cell">{goal.nombre}</td>
            <td className="goal-cell">
                {goal.duracionUnidad === "Indefinido"
                    ? "Indefinido"
                    : `${goal.duracionValor} ${cap(goal.duracionUnidad)}`}
            </td>
            <td className="goal-cell">{objectiveLabel(goal)}</td>
            <td className="goal-cell" style={{ display: "flex", gap: ".4rem" }}>
                {!goal.finalizado && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEntryGoal(goal);
                        }}
                    >
                        Entrada
                    </button>
                )}

                {goal.finalizado ? (
                    <>
                        <span style={{ color: "green", fontWeight: 600 }}>COMPLETADA</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(goal._id);
                            }}
                        >
                            Eliminar
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFinalize(goal._id);
                            }}
                        >
                            Finalizar
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(goal);
                            }}
                        >
                            Editar
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(goal._id);
                            }}
                        >
                            Eliminar
                        </button>
                    </>
                )}
            </td>
        </tr>
    );

    /* render --------------------------------------------------- */
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
                    <button className="avatar-btn" onClick={() => navigate("/profile")}>
                        <img
                            className="avatar-img"
                            src={user?.photoURL || "/default-avatar.svg"}
                            alt="perfil"
                        />
                    </button>
                </div>
            </header>

            {/* ---------- MODAL NUEVA META ---------- */}
            {openNew && (
                <div className="modal-overlay" onClick={() => setOpenNew(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Nueva meta</h2>

                        {/* formulario NUEVA META */}
                        <form onSubmit={handleCreateGoal}>
                            {/* Nombre */}
                            <label>
                                Nombre*:
                                <input
                                    required
                                    value={newGoal.nombre}
                                    onChange={(e) =>
                                        setNewGoal({ ...newGoal, nombre: e.target.value })
                                    }
                                />
                            </label>

                            {/* Periodo */}
                            <label>
                                Periodo*:
                                <div
                                    style={{
                                        display: "flex",
                                        gap: ".5rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <input
                                        type="number"
                                        required={!newGoal.periodoIndef}
                                        disabled={newGoal.periodoIndef}
                                        className="short"
                                        value={newGoal.periodoNum}
                                        onChange={(e) =>
                                            setNewGoal({ ...newGoal, periodoNum: e.target.value })
                                        }
                                    />
                                    <select
                                        disabled={newGoal.periodoIndef}
                                        value={newGoal.periodoUnit}
                                        onChange={(e) =>
                                            setNewGoal({ ...newGoal, periodoUnit: e.target.value })
                                        }
                                    >
                                        <option value="dias">Días</option>
                                        <option value="semanas">Semanas</option>
                                        <option value="meses">Meses</option>
                                        <option value="años">Años</option>
                                    </select>
                                    <label style={{ display: "flex", gap: ".3rem" }}>
                                        <input
                                            type="checkbox"
                                            checked={newGoal.periodoIndef}
                                            onChange={(e) =>
                                                setNewGoal({
                                                    ...newGoal,
                                                    periodoIndef: e.target.checked,
                                                })
                                            }
                                        />
                                        Indefinido
                                    </label>
                                </div>
                            </label>

                            {/* Objetivo */}
                            <label>
                                Objetivo*:
                                <div
                                    style={{
                                        display: "flex",
                                        gap: ".5rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <input
                                        type="number"
                                        required={newGoal.tipo === "num"}
                                        disabled={newGoal.tipo !== "num"}
                                        className="short"
                                        value={newGoal.objetivoNum}
                                        onChange={(e) =>
                                            setNewGoal({
                                                ...newGoal,
                                                objetivoNum: e.target.value,
                                                tipo: "num",
                                            })
                                        }
                                    />
                                    <input
                                        type="text"
                                        required={newGoal.tipo === "num"}
                                        disabled={newGoal.tipo !== "num"}
                                        className="medium"
                                        placeholder="unidad"
                                        value={newGoal.objetivoUnidad}
                                        onChange={(e) =>
                                            setNewGoal({
                                                ...newGoal,
                                                objetivoUnidad: e.target.value,
                                                tipo: "num",
                                            })
                                        }
                                    />
                                    <label style={{ display: "flex", gap: ".3rem" }}>
                                        <input
                                            type="checkbox"
                                            checked={newGoal.tipo === "bool"}
                                            onChange={(e) =>
                                                setNewGoal({
                                                    ...newGoal,
                                                    tipo: e.target.checked ? "bool" : "num",
                                                })
                                            }
                                        />
                                        Boolean
                                    </label>
                                </div>
                            </label>

                            {/* Fecha */}
                            <label className="fecha-wrapper">
                                Fecha inicio:
                                <input
                                    type="date"
                                    className="fecha-input"
                                    value={newGoal.fechaInicio}
                                    onChange={(e) =>
                                        setNewGoal({ ...newGoal, fechaInicio: e.target.value })
                                    }
                                />
                            </label>

                            {/* Descripción */}
                            <label>
                                Descripción:
                                <textarea
                                    rows={3}
                                    value={newGoal.descripcion}
                                    onChange={(e) =>
                                        setNewGoal({ ...newGoal, descripcion: e.target.value })
                                    }
                                />
                            </label>

                            {/* acciones */}
                            <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenNew(false);
                                        setNewGoal(emptyGoal);
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button type="submit">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ---------- MODAL ENTRADA ---------- */}
            {entryGoal && (
                <div className="modal-overlay" onClick={() => setEntryGoal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <h2 style={{ margin: 0 }}>{entryGoal.nombre}</h2>
                            <span style={{ fontWeight: 600 }}>
                {entryGoal.duracionUnidad === "Indefinido"
                    ? "Indefinido"
                    : `${entryGoal.duracionValor} ${cap(
                        entryGoal.duracionUnidad
                    )}`}
              </span>
                        </div>

                        {entryGoal.tipo === "Num" && (
                            <p style={{ textAlign: "center", margin: "0.5rem 0 1rem 0" }}>
                                Objetivo:{" "}
                                <strong>
                                    {entryGoal.valorObjetivo} {entryGoal.unidad}
                                </strong>
                            </p>
                        )}

                        <form onSubmit={handleSaveEntry}>
                            {entryGoal.tipo === "Bool" ? (
                                <label style={{ display: "block", marginBottom: "1rem" }}>
                                    Valor*:
                                    <div
                                        style={{ display: "flex", gap: "1rem", marginTop: ".4rem" }}
                                    >
                                        <label>
                                            <input
                                                type="radio"
                                                checked={entryData.valorBool === true}
                                                onChange={() =>
                                                    setEntryData({ ...entryData, valorBool: true })
                                                }
                                            />{" "}
                                            True
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                checked={entryData.valorBool === false}
                                                onChange={() =>
                                                    setEntryData({ ...entryData, valorBool: false })
                                                }
                                            />{" "}
                                            False
                                        </label>
                                    </div>
                                </label>
                            ) : (
                                <label style={{ display: "block", marginBottom: "1rem" }}>
                                    Valor*:
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: ".4rem",
                                            marginTop: ".4rem",
                                        }}
                                    >
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            className="short"
                                            value={entryData.valorNum}
                                            onChange={(e) =>
                                                setEntryData({ ...entryData, valorNum: e.target.value })
                                            }
                                        />
                                        <span>{entryGoal.unidad}</span>
                                    </div>
                                </label>
                            )}

                            <label style={{ display: "block", marginBottom: "1rem" }}>
                                Fecha:
                                <input
                                    type="date"
                                    className="fecha-input"
                                    value={entryData.fecha}
                                    onChange={(e) =>
                                        setEntryData({ ...entryData, fecha: e.target.value })
                                    }
                                />
                            </label>

                            <div style={{ display: "flex", gap: "1rem" }}>
                                <button type="button" onClick={() => setEntryGoal(null)}>
                                    Cancelar
                                </button>
                                <button type="submit">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ---------- MODAL EDITAR META ---------- */}
            {editGoal && (
                <div className="modal-overlay" onClick={() => setEditGoal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Editar meta ({editGoal.tipo})</h3>

                        <form onSubmit={handleSaveEdit}>
                            <label>
                                Nombre:
                                <input
                                    value={editForm.nombre}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, nombre: e.target.value })
                                    }
                                    maxLength={50}
                                />
                            </label>

                            <label>
                                Descripción:
                                <textarea
                                    rows={3}
                                    value={editForm.descripcion}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, descripcion: e.target.value })
                                    }
                                />
                            </label>

                            <label>
                                Duración:
                                <div
                                    style={{
                                        display: "flex",
                                        gap: ".5rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <input
                                        type="number"
                                        className="short"
                                        disabled={editForm.periodoIndef}
                                        required={!editForm.periodoIndef}
                                        value={editForm.periodoNum}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, periodoNum: e.target.value })
                                        }
                                    />
                                    <select
                                        disabled={editForm.periodoIndef}
                                        value={editForm.periodoUnit}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, periodoUnit: e.target.value })
                                        }
                                    >
                                        <option value="dias">Días</option>
                                        <option value="semanas">Semanas</option>
                                        <option value="meses">Meses</option>
                                        <option value="años">Años</option>
                                    </select>
                                    <label style={{ display: "flex", gap: ".3rem" }}>
                                        <input
                                            type="checkbox"
                                            checked={editForm.periodoIndef}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    periodoIndef: e.target.checked,
                                                })
                                            }
                                        />
                                        Indefinido
                                    </label>
                                </div>
                            </label>

                            {editGoal.tipo === "Num" && (
                                <>
                                    <label>
                                        Valor objetivo:
                                        <input
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={editForm.objetivoNum}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    objetivoNum: e.target.value,
                                                })
                                            }
                                        />
                                    </label>

                                    <label>
                                        Unidad:
                                        <input
                                            value={editForm.objetivoUnidad}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    objetivoUnidad: e.target.value,
                                                })
                                            }
                                            maxLength={20}
                                        />
                                    </label>
                                </>
                            )}

                            <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                                <button type="button" onClick={() => setEditGoal(null)}>
                                    Cancelar
                                </button>
                                <button type="submit">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ---------- TABLA + DETALLE ---------- */}
            <main className="goals-table-wrapper">
                <table className="goals-table">
                    <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Periodo</th>
                        <th>Objetivo</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>{goals.map((g) => <GoalRow key={g._id} goal={g} />)}</tbody>
                </table>

                {selectedGoal && (
                    <div className="goal-detail">
                        {/* registros */}
                        <div className="goal-registros">
                            <h3>Registros</h3>

                            {selectedGoal.registros?.length ? (
                                <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                        <tr>
                                            <th style={{ width: "45%" }}>Fecha</th>
                                            <th style={{ width: "35%" }}>
                                                Valor{" "}
                                                {selectedGoal.tipo === "Num" &&
                                                    `(${selectedGoal.unidad})`}
                                            </th>
                                            <th style={{ width: "20%" }} />
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {selectedGoal.registros
                                            .slice()
                                            .sort((a, b) => b.fecha.localeCompare(a.fecha))
                                            .map((r) => (
                                                <tr key={r.fecha}>
                                                    <td>{fmtFecha(r.fecha)}</td>
                                                    <td style={{ textAlign: "center" }}>
                                                        {selectedGoal.tipo === "Bool"
                                                            ? r.valorBool
                                                                ? "✅"
                                                                : "❌"
                                                            : r.valorNum}
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <button
                                                            style={{
                                                                background: "#e74c3c",
                                                                color: "#fff",
                                                            }}
                                                            onClick={() =>
                                                                handleDeleteRecord(
                                                                    selectedGoal._id,
                                                                    r.fecha
                                                                )
                                                            }
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="registros-placeholder">Sin registros.</div>
                            )}
                        </div>

                        {/* descripción */}
                        <div className="goal-descripcion">
                            <h3>Descripción</h3>
                            <p>{selectedGoal.descripcion || "Sin descripción."}</p>
                        </div>
                    </div>
                )}
            </main>

            {/* ---------- ESTADÍSTICAS ---------- */}
            <section className="user-stats">
                <h2 style={{ margin: "0 0 1rem 0", padding: "1rem" }}>
                    Estadísticas del usuario
                </h2>
                {stats ? (
                    <ul
                        style={{
                            listStyle: "none",
                            padding: "0 1.5rem 1.5rem 1.5rem",
                        }}
                    >
                        <li>Metas totales: {stats.totalMetas}</li>
                        <li>
                            Metas activas:{" "}
                            {stats.totalMetas - stats.totalMetasFinalizadas}
                        </li>
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