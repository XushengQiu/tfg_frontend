// src/components/NewGoalModal.jsx
import React, { useEffect, useState, useMemo } from "react";

const todayISO = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const isIntIn = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
const isDecimal2In = (s, a, b) => {
    if (s === "" || s == null) return false;
    const txt = String(s).trim();
    if (!/^\d{1,13}(\.\d{1,2})?$/.test(txt)) return false;
    const n = Number(txt);
    return !Number.isNaN(n) && n >= a && n <= b;
};

export default function NewGoalModal({ open, onClose, onCreate }) {
    const [nombre, setNombre] = useState("");
    const [periodoNum, setPeriodoNum] = useState("");
    const [periodoUnit, setPeriodoUnit] = useState("dias");
    const [periodoIndef, setPeriodoIndef] = useState(false);

    const [objetivoNum, setObjetivoNum] = useState("");
    const [objetivoUnidad, setObjetivoUnidad] = useState("");
    const [isBool, setIsBool] = useState(false);

    const [fechaInicio, setFechaInicio] = useState(todayISO());
    const [descripcion, setDescripcion] = useState("");

    useEffect(() => {
        if (!open) {
            setNombre("");
            setPeriodoNum("");
            setPeriodoUnit("dias");
            setPeriodoIndef(false);
            setObjetivoNum("");
            setObjetivoUnidad("");
            setIsBool(false);
            setFechaInicio(todayISO());
            setDescripcion("");
        }
    }, [open]);

    const canSubmit = useMemo(() => {
        const nameOk = nombre.trim().length >= 1 && nombre.trim().length <= 50;
        const descrOk = (descripcion || "").trim().length <= 300;
        const periodoOk =
            periodoIndef ||
            (String(periodoNum).trim() !== "" &&
                isIntIn(Number(periodoNum), 1, 10000));
        const objetivoOk =
            isBool || isDecimal2In(objetivoNum, 0.01, 9999999999999.99);
        const unidadOk =
            isBool ||
            (objetivoUnidad.trim().length >= 1 && objetivoUnidad.trim().length <= 20);
        return nameOk && descrOk && periodoOk && objetivoOk && unidadOk && !!fechaInicio;
    }, [nombre, descripcion, periodoIndef, periodoNum, isBool, objetivoNum, objetivoUnidad, fechaInicio]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        onCreate({
            tipo: isBool ? "bool" : "num",
            nombre: nombre.trim(),
            descripcion: (descripcion || "").trim(),
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
                            minLength={1}
                            maxLength={50}
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
                                max="10000"
                                step="1"
                                value={periodoNum}
                                onChange={(e) => setPeriodoNum(e.target.value)}
                                disabled={periodoIndef}
                                required={!periodoIndef}
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
                                inputMode="decimal"
                                step="0.01"
                                min="0.01"
                                max="9999999999999.99"
                                value={objetivoNum}
                                onChange={(e) => setObjetivoNum(e.target.value)}
                                disabled={isBool}
                                required={!isBool}
                            />
                            <input
                                type="text"
                                placeholder="unidad"
                                value={objetivoUnidad}
                                onChange={(e) => setObjetivoUnidad(e.target.value)}
                                disabled={isBool}
                                minLength={1}
                                maxLength={20}
                                required={!isBool}
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

                    {/* Fecha de inicio */}
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
                            maxLength={300}
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
