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
    deleteGoal,
    finalizeGoal,
} from "../services/api";

import "../index.css";

/* capitaliza la primera letra */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Dashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    /* ───── estado ───── */
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

    /* ───── función para traer / refrescar todo ───── */
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
                        return m; // si falla el detalle, nos quedamos con la parcial
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

    /* ───── helpers ───── */
    const handleSelectGoal = (g) =>
        setSelectedGoal((cur) => (cur?._id === g._id ? null : g));

    const handleFinalize = async (id) => {
        if (!window.confirm("¿Marcar esta meta como COMPLETADA?")) return;
        try {
            await finalizeGoal(id);
            await loadData();
        } catch (err) {
            console.error(err);
            alert("No se pudo finalizar la meta.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar esta meta? Esta acción es irreversible.")) return;
        try {
            await deleteGoal(id);
            await loadData();
        } catch (err) {
            console.error(err);
            alert("No se pudo eliminar la meta.");
        }
    };

    const objectiveLabel = (g) => {
        if (g.tipo === "Bool") return "Boolean";
        const val =
            g.valorObjetivo ?? g.valor ?? g.objetivo ?? g.objetivoValor ?? undefined;
        const unit = g.unidad ?? g.unidadMedida ?? "";
        return val !== undefined ? `${val} ${unit}`.trim() : "-";
    };

    /* ───── tabla fila ───── */
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
                {goal.finalizado ? (
                    <>
                        <span style={{ color: "green", fontWeight: 600 }}>COMPLETADA</span>
                        <button onClick={() => handleDelete(goal._id)}>Eliminar</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => alert("Entrada aún no implementada")}>
                            Entrada
                        </button>
                        <button onClick={() => handleFinalize(goal._id)}>Finalizar</button>
                        <button onClick={() => navigate(`/edit/${goal._id}`)}>Editar</button>
                        <button onClick={() => handleDelete(goal._id)}>Eliminar</button>
                    </>
                )}
            </td>
        </tr>
    );

    /* ───── crear meta ───── */
    const handleCreateGoal = async (e) => {
        e.preventDefault();
        try {
            if (newGoal.tipo === "bool") {
                await createGoalBool({
                    nombre: newGoal.nombre,
                    fecha: newGoal.fechaInicio,
                    descripcion: newGoal.descripcion,
                    duracionValor: newGoal.periodoIndef ? -1 : Number(newGoal.periodoNum),
                    duracionUnidad: newGoal.periodoIndef
                        ? "Indefinido"
                        : cap(newGoal.periodoUnit),
                });
            } else {
                await createGoalNum({
                    nombre: newGoal.nombre,
                    fecha: newGoal.fechaInicio,
                    descripcion: newGoal.descripcion,
                    valorObjetivo: Number(newGoal.objetivoNum),
                    unidad: newGoal.objetivoUnidad,
                    duracionValor: newGoal.periodoIndef ? -1 : Number(newGoal.periodoNum),
                    duracionUnidad: newGoal.periodoIndef
                        ? "Indefinido"
                        : cap(newGoal.periodoUnit),
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

    /* ───── loader ───── */
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

            {/* modal crear meta */}
            {openNew && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Nueva meta</h2>

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
                                <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
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
                                                setNewGoal({ ...newGoal, periodoIndef: e.target.checked })
                                            }
                                        />
                                        Indefinido
                                    </label>
                                </div>
                            </label>

                            {/* Objetivo */}
                            <label>
                                Objetivo*:
                                <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
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

            {/* tabla de metas */}
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
