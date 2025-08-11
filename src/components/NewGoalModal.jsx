// src/components/NewGoalModal.jsx
import React, { useEffect, useState } from "react";

const todayISO = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function NewGoalModal({ open, onClose, onCreate }) {
    const [nombre, setNombre] = useState("");
    const [periodoNum, setPeriodoNum] = useState("");
    const [periodoUnit, setPeriodoUnit] = useState("dias");
    const [periodoIndef, setPeriodoIndef] = useState(false);

    const [objetivoNum, setObjetivoNum] = useState("");
    const [objetivoUnidad, setObjetivoUnidad] = useState("");
    const [isBool, setIsBool] = useState(false);

    // ← fecha por defecto: HOY
    const [fechaInicio, setFechaInicio] = useState(todayISO());

    const [descripcion, setDescripcion] = useState("");

    // Resetear al cerrar, dejando fecha en HOY
    useEffect(() => {
        if (!open) {
            setNombre("");
            setPeriodoNum("");
            setPeriodoUnit("dias");
            setPeriodoIndef(false);
            setObjetivoNum("");
            setObjetivoUnidad("");
            setIsBool(false);
            setFechaInicio(todayISO()); // ← vuelve a hoy cuando se cierra
            setDescripcion("");
        }
    }, [open]);

    const canSubmit =
        nombre.trim().length > 0 &&
        fechaInicio && // ya viene con hoy por defecto
        (periodoIndef || (!!periodoNum && Number(periodoNum) > 0)) &&
        (isBool || (!!objetivoNum && Number(objetivoNum) > 0 && objetivoUnidad.trim().length > 0));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        onCreate({
            tipo: isBool ? "bool" : "num",
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            fechaInicio,
            periodoIndef,
            periodoNum,
            periodoUnit,
            objetivoNum,
            objetivoUnidad: objetivoUnidad.trim(),
        });
    };

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" aria-label="Cerrar" onClick={onClose}>×</button>

                <h2 style={{ textAlign: "center", marginTop: 0 }}>Nueva meta</h2>

                <form onSubmit={handleSubmit}>
                    {/* Nombre */}
                    <label>
                        Nombre*:
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                    </label>

                    {/* Periodo */}
                    <label>
                        Periodo*:
                        <div className={`field-group ${periodoIndef ? "group-disabled" : ""}`}>
                            <input
                                className="short"
                                type="number"
                                min="1"
                                value={periodoNum}
                                onChange={(e) => setPeriodoNum(e.target.value)}
                                disabled={periodoIndef}
                            />
                            <select
                                className="medium"
                                value={periodoUnit}
                                onChange={(e) => setPeriodoUnit(e.target.value)}
                                disabled={periodoIndef}
                            >
                                <option value="dias">Días</option>
                                <option value="semanas">Semanas</option>
                                <option value="meses">Meses</option>
                                <option value="años">Años</option>
                            </select>

                            <label className="inline-check">
                                <input
                                    type="checkbox"
                                    checked={periodoIndef}
                                    onChange={(e) => setPeriodoIndef(e.target.checked)}
                                />
                                Indefinido
                            </label>
                        </div>
                    </label>

                    {/* Objetivo */}
                    <label>
                        Objetivo*:
                        <div className={`field-group ${isBool ? "group-disabled" : ""}`}>
                            <input
                                type="number"
                                value={objetivoNum}
                                onChange={(e) => setObjetivoNum(e.target.value)}
                                disabled={isBool}
                            />
                            <input
                                type="text"
                                placeholder="unidad"
                                value={objetivoUnidad}
                                onChange={(e) => setObjetivoUnidad(e.target.value)}
                                disabled={isBool}
                            />
                            <label className="inline-check">
                                <input
                                    type="checkbox"
                                    checked={isBool}
                                    onChange={(e) => setIsBool(e.target.checked)}
                                />
                                Boolean
                            </label>
                        </div>
                    </label>

                    {/* Fecha de inicio (pre-cargada a HOY) */}
                    <label>
                        Fecha inicio:
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            required
                        />
                    </label>

                    {/* Descripción */}
                    <label>
                        Descripción:
                        <textarea
                            rows="4"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                    </label>

                    <div style={{ display: "flex", gap: "8px" }}>
                        <button type="button" onClick={onClose}>Cancelar</button>
                        <button type="submit" disabled={!canSubmit}>Crear</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
