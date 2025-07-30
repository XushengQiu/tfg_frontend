// ───────────────────────────────────────────────────────────────
// src/pages/Dashboard.jsx
// ───────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth-context";

import {
    getProfile,
    getGoalById,
    createGoalBool,
    createGoalNum,
    createRecordBool,
    createRecordNum,
    deleteGoal,
    finalizeGoal,
} from "../services/api";

import "../index.css";

/* capitaliza la primera letra */
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

export default function Dashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    /* ───── estado global ───── */
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState(null);

    /* modal crear meta */
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

    /* modal entrada / registro */
    const [entryGoal, setEntryGoal] = useState(null);
    const todayISO = new Date().toISOString().substring(0, 10);
    const [entryData, setEntryData] = useState({
        fecha: todayISO,
        valorBool: null,
        valorNum: "",
    });

    /* ───── carga / refresco ───── */
    const loadData = async () => {
        setLoading(true);
        try {
            const { data } = await getProfile();
            const metasDetalladas = await Promise.all(
                data.metas.map(async (m) => {
                    try {
                        const { data: det } = await getGoalById(m._id);
                        return { ...m, ...det };
                    } catch {
                        return m;
                    }
                })
            );
            setGoals(metasDetalladas);
            setStats(data.estadisticas);
        } catch (err) {
            console.error(err);
            alert("No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadData(); }, []);

    /* ───── helpers tabla ───── */
    const objectiveLabel = (g) =>
        g.tipo === "Bool"
            ? "Boolean"
            : `${g.valorObjetivo ?? "-"} ${g.unidad ?? ""}`.trim();

    const handleSelectGoal = (g) =>
        setSelectedGoal((cur) => (cur?._id === g._id ? null : g));

    const handleFinalize = async (id) => {
        if (!window.confirm("¿Marcar esta meta como COMPLETADA?")) return;
        try { await finalizeGoal(id); await loadData(); }
        catch (err) { console.error(err); alert("No se pudo finalizar."); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar esta meta? Acción irreversible.")) return;
        try { await deleteGoal(id); await loadData(); }
        catch (err) { console.error(err); alert("No se pudo eliminar."); }
    };

    /* ───── guardar registro ───── */
    const handleSaveEntry = async (e) => {
        e.preventDefault();
        if (!entryGoal) return;

        try {
            if (entryGoal.tipo === "Bool") {
                if (entryData.valorBool === null) return alert("Selecciona True o False");
                await createRecordBool(entryGoal._id, {
                    fecha: entryData.fecha,
                    valorBool: entryData.valorBool,
                });
            } else {
                if (entryData.valorNum === "") return alert("Introduce un valor numérico");
                await createRecordNum(entryGoal._id, {
                    fecha: entryData.fecha,
                    valorNum: Number(entryData.valorNum),
                });
            }
            setEntryGoal(null);
            setEntryData({ fecha: todayISO, valorBool: null, valorNum: "" });
            await loadData();
        } catch (err) {
            console.error(err);
            alert("No se pudo guardar el registro.");
        }
    };

    /* ───── fila de la tabla ───── */
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
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setEntryGoal(goal);
                    }}
                >
                    Entrada
                </button>

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
                                navigate(`/edit/${goal._id}`);
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

    /* ───── crear meta (sin cambios funcionales) ───── */
    const handleCreateGoal = async (e) => {
        e.preventDefault();
        const duracionValor  = newGoal.periodoIndef ? 1 : Number(newGoal.periodoNum);
        const duracionUnidad = newGoal.periodoIndef ? "Indefinido" : cap(newGoal.periodoUnit);

        try {
            if (newGoal.tipo === "bool") {
                await createGoalBool({
                    nombre: newGoal.nombre,
                    descripcion: newGoal.descripcion,
                    fecha: newGoal.fechaInicio,
                    duracionValor,
                    duracionUnidad,
                });
            } else {
                await createGoalNum({
                    nombre: newGoal.nombre,
                    descripcion: newGoal.descripcion,
                    fecha: newGoal.fechaInicio,
                    duracionValor,
                    duracionUnidad,
                    valorObjetivo: Number(newGoal.objetivoNum),
                    unidad: newGoal.objetivoUnidad,
                });
            }
            setOpenNew(false);
            setNewGoal(emptyGoal);
            await loadData();
        } catch (err) {
            console.error(err);
            alert("No se pudo crear la meta.");
        }
    };

    if (loading) return <p className="dashboard-loading">Cargando…</p>;

    /* ───── render ───── */
    return (
        <div className="dashboard-wrapper">
            {/* header */}
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

            {/* -------- Modal crear meta (código sin variar) -------- */}
            {openNew && (
                /* ... formulario de creación ya incluido en tu versión previa ... */
                /* (recortado aquí por brevedad) */
                <> {/* Pon aquí el bloque del modal “Nueva meta” tal cual lo tenías */} </>
            )}

            {/* -------- Modal entrada / registro -------- */}
            {entryGoal && (
                <div className="modal-overlay" onClick={() => setEntryGoal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        {/* cabecera */}
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <h2 style={{ margin: 0 }}>{entryGoal.nombre}</h2>
                            <span style={{ fontWeight: 600 }}>
                {entryGoal.duracionUnidad === "Indefinido"
                    ? "Indefinido"
                    : `${entryGoal.duracionValor} ${cap(entryGoal.duracionUnidad)}`}
              </span>
                        </div>

                        {/* objetivo (solo Num) */}
                        {entryGoal.tipo === "Num" && (
                            <p style={{ textAlign: "center", margin: "0.5rem 0 1rem 0" }}>
                                Objetivo:{" "}
                                <strong>
                                    {entryGoal.valorObjetivo} {entryGoal.unidad}
                                </strong>
                            </p>
                        )}

                        {/* formulario */}
                        <form onSubmit={handleSaveEntry}>
                            {/* valor */}
                            {entryGoal.tipo === "Bool" ? (
                                <label style={{ display: "block", marginBottom: "1rem" }}>
                                    Valor*:
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "1rem",
                                            marginTop: ".4rem",
                                        }}
                                    >
                                        <label>
                                            <input
                                                type="radio"
                                                name="valorBool"
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
                                                name="valorBool"
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
                                                setEntryData({
                                                    ...entryData,
                                                    valorNum: e.target.value,
                                                })
                                            }
                                        />
                                        <span>{entryGoal.unidad}</span>
                                    </div>
                                </label>
                            )}

                            {/* fecha */}
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

                            {/* acciones */}
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

            {/* tabla + detalle */}
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
                        <div className="goal-registros">
                            <h3>Registros</h3>
                            <div className="registros-placeholder">Próximamente…</div>
                        </div>

                        <div className="goal-descripcion">
                            <h3>Descripción</h3>
                            <p>{selectedGoal.descripcion || "Sin descripción."}</p>
                        </div>
                    </div>
                )}
            </main>

            {/* estadísticas */}
            <section className="user-stats">
                <h2 style={{ margin: "0 0 1rem 0", padding: "1rem" }}>
                    Estadísticas del usuario
                </h2>
                {stats ? (
                    <ul style={{ listStyle: "none", padding: "0 1.5rem 1.5rem 1.5rem" }}>
                        <li>
                            Metas totales: {stats.totalMetas}
                        </li>
                        <li>
                            Metas activas: {stats.totalMetas - stats.totalMetasFinalizadas}
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
