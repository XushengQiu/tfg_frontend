// ───────────────────────────────────────────────────────────────
// src/pages/Dashboard.jsx
// Dashboard principal   –   sin Tailwind  –   UI en CSS propio
// ───────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useNavigate }                from "react-router-dom";
import { useAuth }                    from "../auth-context";
import {
    getProfile,
    getGoalById,
    createGoalBool,
    createGoalNum,
    deleteGoal,
    finalizeGoal,
} from "../services/api";
import "../index.css";

/* util: capitalizar (“meses” → “Meses”) */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Dashboard() {
    const { profile, user } = useAuth();
    const navigate = useNavigate();

    /*──────────────── estado ────────────────*/
    const [goals,   setGoals]   = useState([]);
    const [stats,   setStats]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState(null);

    /*──────── modal Crear meta ───────*/
    const [openNew, setOpenNew] = useState(false);
    const resetForm = () => setNewGoal({
        nombre:"",

        periodoIndef:false,
        periodoNum:"",
        periodoUnit:"dias",

        tipo:"num",
        objetivoNum:"",
        objetivoUnidad:"",

        descripcion:"",
        fechaInicio:new Date().toISOString().substring(0,10)
    });
    const [newGoal, setNewGoal] = useState(() => ({}));
    useEffect(resetForm, []);

    /*──────── carga inicial ─────────*/
    useEffect(() => {
        (async () => {
            try {
                const { data } = await getProfile();

                /* metas numéricas → añadir valorObjetivo + unidad            */
                const metasConDetalles = await Promise.all(
                    data.metas.map(async (m) => {
                        if (m.tipo === "Num") {
                            try {
                                const { data: det } = await getGoalById(m._id);
                                return { ...m, valorObjetivo:det.valorObjetivo, unidad:det.unidad };
                            } catch {/* ignora error */}
                        }
                        return m;
                    })
                );

                setGoals(metasConDetalles);
                setStats(data.estadisticas);
            } catch (err) { console.error(err); }
            finally        { setLoading(false); }
        })();
    }, []);

    /*──────── helpers fila tabla ─────*/
    const GoalRow = ({ goal }) => (
        <tr
            className={`goal-row ${goal.finalizado ? "goal-row-finalizada" : ""}`}
            onClick={() => setSelectedGoal(goal._id === selectedGoal?._id ? null : goal)}
        >
            {/* ─── nombre ─── */}
            <td className="goal-cell">{goal.nombre}</td>

            {/* ─── periodo ─── */}
            <td className="goal-cell">
                {goal.duracionUnidad === "Indefinido"
                    ? "Indefinido"
                    : `${goal.duracionValor} ${goal.duracionUnidad}`}
            </td>

            {/* ─── objetivo ─── */}
            <td className="goal-cell">
                {goal.tipo === "Bool"
                    ? "Boolean"
                    : `${goal.valorObjetivo ?? "…"} ${goal.unidad ?? ""}`}
            </td>

            {/* ─── acciones / completada ─── */}
            <td className="goal-cell" style={{ textAlign:"center" }}>
                {goal.finalizado ? (
                    <>
                        <span style={{ color:"green", fontWeight:600 }}>COMPLETADA</span>{" "}
                        <button
                            onClick={(e)=>{e.stopPropagation(); handleDelete(goal._id);}}
                        >
                            Eliminar
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={(e)=>e.stopPropagation()}>Entrada</button>
                        <button onClick={(e)=>e.stopPropagation()}>Editar</button>
                        <button
                            onClick={(e)=>{e.stopPropagation();handleFinalize(goal._id);}}
                        >
                            Finalizar
                        </button>
                        <button
                            onClick={(e)=>{e.stopPropagation();handleDelete(goal._id);}}
                        >
                            Eliminar
                        </button>
                    </>
                )}
            </td>
        </tr>
    );

    /*──────── acciones metas ────────*/
    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar meta definitivamente?")) return;
        try   { await deleteGoal(id); }
        catch { alert("Error al eliminar meta"); return; }

        setGoals((prev)=>prev.filter((m)=>m._id !== id));
        if (selectedGoal?._id === id) setSelectedGoal(null);
    };

    const handleFinalize = async (id) => {
        try   { await finalizeGoal(id); }
        catch { alert("Error al finalizar meta"); return; }

        setGoals((prev)=>prev.map((m)=>m._id === id ? { ...m, finalizado:true } : m));
    };

    /*──────── creación de meta ──────*/
    const handleCreateGoal = async (e) => {
        e.preventDefault();

        const duracionValor  = newGoal.periodoIndef ? 1 : Number(newGoal.periodoNum || 0);
        const duracionUnidad = newGoal.periodoIndef ? "Indefinido" : cap(newGoal.periodoUnit);

        const common = {
            nombre       : newGoal.nombre,
            descripcion  : newGoal.descripcion,
            fecha        : newGoal.fechaInicio,
            duracionValor,
            duracionUnidad,
        };

        try {
            if (newGoal.tipo === "bool") {
                await createGoalBool(common);
            } else {
                await createGoalNum({
                    ...common,
                    valorObjetivo:Number(newGoal.objetivoNum || 0),
                    unidad:newGoal.objetivoUnidad
                });
            }

            /* recarga metas + stats */
            const { data } = await getProfile();
            const metasDet = await Promise.all(
                data.metas.map(async (m) => {
                    if (m.tipo === "Num") {
                        try {
                            const { data: det } = await getGoalById(m._id);
                            return { ...m, valorObjetivo:det.valorObjetivo, unidad:det.unidad };
                        } catch {}
                    }
                    return m;
                })
            );
            setGoals(metasDet);
            setStats(data.estadisticas);
            setOpenNew(false);
            resetForm();
        } catch (err) {
            console.error(err.response?.data || err);
            alert("Error al crear la meta");
        }
    };

    /*── estilos atenuados (indefinido / boolean) ─*/
    const faded = { opacity:0.3, pointerEvents:"none" };

    /*──────── vista cargando ────────*/
    if (loading) return <p style={{ padding:"1.5rem" }}>Cargando…</p>;

    /*──────────────── render ────────*/
    return (
        <div style={{ padding:"1rem" }}>
            {/* ─── encabezado ─── */}
            <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <h1 style={{ fontSize:"1.8rem" }}>Hola, {profile?.nombre ?? profile?.name}</h1>
                <div style={{ display:"flex", gap:"1rem", alignItems:"center" }}>
                    <button onClick={()=>setOpenNew(true)}>Crear meta</button>
                    <button
                        onClick={()=>navigate("/profile")}
                        style={{ width:40, height:40, borderRadius:"50%", overflow:"hidden", border:"1px solid #ccc" }}
                    >
                        <img
                            src={user?.photoURL || "/default-avatar.svg"}
                            alt="perfil"
                            style={{ width:"100%", height:"100%", objectFit:"cover" }}
                        />
                    </button>
                </div>
            </header>

            {/* ─── modal Crear meta ─── */}
            {openNew && (
                <div className="modal-overlay">
                    <div className="modal">
                        <form onSubmit={handleCreateGoal}>

                            {/* Nombre */}
                            <label>Nombre*:
                                <input
                                    required
                                    value={newGoal.nombre}
                                    onChange={(e)=>setNewGoal({ ...newGoal, nombre:e.target.value })}
                                />
                            </label>

                            {/* Periodo */}
                            <label>Periodo*:
                                <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                                    <input
                                        type="number"
                                        required={!newGoal.periodoIndef}
                                        disabled={newGoal.periodoIndef}
                                        style={{ width:"4rem", ...(newGoal.periodoIndef ? faded : {}) }}
                                        value={newGoal.periodoNum}
                                        onChange={(e)=>setNewGoal({ ...newGoal, periodoNum:e.target.value })}
                                    />
                                    <select
                                        disabled={newGoal.periodoIndef}
                                        style={newGoal.periodoIndef ? faded : {}}
                                        value={newGoal.periodoUnit}
                                        onChange={(e)=>setNewGoal({ ...newGoal, periodoUnit:e.target.value })}
                                    >
                                        <option value="dias">Días</option>
                                        <option value="semanas">Semanas</option>
                                        <option value="meses">Meses</option>
                                        <option value="años">Años</option>
                                    </select>
                                    <label style={{ display:"flex", gap:"0.3rem" }}>
                                        <input
                                            type="checkbox"
                                            checked={newGoal.periodoIndef}
                                            onChange={(e)=>setNewGoal({ ...newGoal, periodoIndef:e.target.checked })}
                                        />
                                        Indefinido
                                    </label>
                                </div>
                            </label>

                            {/* Objetivo */}
                            <label>Objetivo*:
                                <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                                    <input
                                        type="number"
                                        required={newGoal.tipo === "num"}
                                        disabled={newGoal.tipo !== "num"}
                                        style={{ width:"6rem", ...(newGoal.tipo !== "num" ? faded : {}) }}
                                        value={newGoal.objetivoNum}
                                        onChange={(e)=>setNewGoal({ ...newGoal, objetivoNum:e.target.value, tipo:"num" })}
                                    />
                                    <input
                                        type="text"
                                        required={newGoal.tipo === "num"}
                                        disabled={newGoal.tipo !== "num"}
                                        style={{ width:"7rem", ...(newGoal.tipo !== "num" ? faded : {}) }}
                                        placeholder="unidad"
                                        value={newGoal.objetivoUnidad}
                                        onChange={(e)=>setNewGoal({ ...newGoal, objetivoUnidad:e.target.value, tipo:"num" })}
                                    />
                                    <label style={{ display:"flex", gap:"0.3rem" }}>
                                        <input
                                            type="checkbox"
                                            checked={newGoal.tipo === "bool"}
                                            onChange={(e)=>setNewGoal({ ...newGoal, tipo:e.target.checked ? "bool" : "num" })}
                                        />
                                        Boolean
                                    </label>
                                </div>
                            </label>

                            {/* Fecha */}
                            <label>Fecha inicio:
                                <input
                                    type="date"
                                    value={newGoal.fechaInicio}
                                    onChange={(e)=>setNewGoal({ ...newGoal, fechaInicio:e.target.value })}
                                />
                            </label>

                            {/* Descripción */}
                            <label>Descripción:
                                <textarea
                                    rows={3}
                                    value={newGoal.descripcion}
                                    onChange={(e)=>setNewGoal({ ...newGoal, descripcion:e.target.value })}
                                />
                            </label>

                            {/* acciones */}
                            <div style={{ marginTop:"1rem", display:"flex", gap:"1rem" }}>
                                <button type="button" onClick={()=>{ setOpenNew(false); resetForm(); }}>
                                    Cancelar
                                </button>
                                <button type="submit">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── tabla ─── */}
            <main style={{ marginTop:"2rem" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                    <tr><th>Nombre</th><th>Periodo</th><th>Objetivo</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                    {goals.map((g)=><GoalRow key={g._id} goal={g} />)}
                    </tbody>
                </table>

                {/* detalle */}
                {selectedGoal && (
                    <div style={{ display:"flex", gap:"2rem", marginTop:"1.5rem" }}>
                        <div style={{ flex:1 }}>
                            <h3>Registros</h3>
                            <div className="registros-placeholder">Próximamente…</div>
                        </div>
                        <div style={{ flex:1 }}>
                            <h3>Descripción</h3>
                            <p>{selectedGoal.descripcion || "Sin descripción."}</p>
                        </div>
                    </div>
                )}
            </main>

            {/* ─── estadísticas ─── */}
            <section style={{ marginTop:"3rem" }}>
                <h2>Estadísticas del usuario</h2>
                <ul>
                    <li>Metas activas: {stats ? stats.totalMetas - stats.totalMetasFinalizadas : "-"}</li>
                    <li>Metas finalizadas: {stats?.totalMetasFinalizadas ?? "-"}</li>
                    <li>Porcentaje finalizadas: {stats?.porcentajeFinalizadas ?? "-"}%</li>
                </ul>
            </section>
        </div>
    );
}
