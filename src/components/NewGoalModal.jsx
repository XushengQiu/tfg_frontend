// src/components/NewGoalModal.jsx
import React, { useEffect, useState, useMemo } from "react";
import "../index.css";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import tutorialIcon from "../assets/icons/tutorial.png";

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

const darken = (hex, f = 0.18) => {
    const n = hex.replace("#", "");
    const to = (i) =>
        Math.max(0, Math.min(255, Math.floor(parseInt(n.slice(i, i + 2), 16) * (1 - f))));
    return `rgb(${to(0)}, ${to(2)}, ${to(4)})`;
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
            (String(periodoNum).trim() !== "" && isIntIn(Number(periodoNum), 1, 10000));
        const objetivoOk = isBool || isDecimal2In(objetivoNum, 0.01, 9999999999999.99);
        const unidadOk =
            isBool ||
            (objetivoUnidad.trim().length >= 1 && objetivoUnidad.trim().length <= 20);
        return nameOk && descrOk && periodoOk && objetivoOk && unidadOk && !!fechaInicio;
    }, [
        nombre,
        descripcion,
        periodoIndef,
        periodoNum,
        isBool,
        objetivoNum,
        objetivoUnidad,
        fechaInicio,
    ]);

    const submit = (e) => {
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

    const startNewGoalTour = React.useCallback(() => {
        const steps = [
            { element: '#newgoal-name',
                popover: {
                    title: 'Nombre',
                    description: 'Entre 1 y 50 caracteres.',
                    side: 'top'
                }},

            { element: '#newgoal-period',
                popover: {
                    title: 'Periodo',
                    description: 'Tiempo durante el que seguirás la meta. Si es para siempre o no lo tienes claro, marca Indefinido.',
                    side: 'top'
                }},

            { element: '#newgoal-obj',
                popover: {
                    title: 'Objetivo',
                    description: 'Define un objetivo numérico (número + unidad) o marca Check si es un sí/no. \nPor ejemplo, ir al gym podemos usar una meta de objetivo Check (Sí (he ido) / No (he ido)), o correr 5km podemos usar una meta numérica (El objetivo sería "5" y la unidad "Km")',
                    side: 'top'
                }},

            { element: '#newgoal-date',
                popover: {
                    title: 'Fecha de inicio',
                    description: 'Desde cuándo empiezas a contabilizar la meta.',
                    side: 'top'
                }},

            { element: '#newgoal-desc',
                popover: {
                    title: 'Descripción',
                    description: 'Opcional. Hasta 300 caracteres para anotar detalles.',
                    side: 'top'
                }},

            { element: '#newgoal-actions',
                popover: {
                    title: 'Acciones',
                    description: 'Cancelar o Crear la meta cuando completes los campos obligatorios.',
                    side: 'top'
                }},
        ];

        const d = driver({
            steps,
            showProgress: true,
            progressText: '{{current}} de {{total}}',
            prevBtnText: 'Anterior',
            nextBtnText: 'Siguiente',
            doneBtnText: 'Finalizar',
            overlayClick: false,
            disableActiveInteraction: true   // ← bloqueador de clics mientras estás en cada paso
        });

        d.drive();
    }, []);

    if (!open) return null;

    const INPUT = {
        borderRadius: 6,
        border: "1px solid #E0E0E0",
        padding: "8px 10px",
        outline: "none",
    };
    const ROW = {
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: ".6rem",
        alignItems: "center",
    };
    const INLINE = { display: "flex", gap: ".5rem", alignItems: "center" };

    const GREEN = "#7FE08A";
    const RED = "#E74C3C";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "min(620px, 92vw)",
                    maxWidth: 620,
                    padding: "18px 20px 14px",
                    borderRadius: 14,
                }}
            >
                <button
                    type="button"
                    className="avatar-btn modal-help"
                    id="newgoal-help"
                    onClick={startNewGoalTour}
                    title="Abrir tutorial"
                    aria-label="Abrir tutorial"
                >
                    <img src={tutorialIcon} alt="Abrir tutorial" className="avatar-icon" />
                </button>
                <h3 style={{ textAlign: "center", marginTop: 0, marginBottom: "10px" }}>
                    Nueva meta
                </h3>

                <form onSubmit={submit} style={{ display: "grid", gap: ".6rem" }}>
                    {/* Nombre */}
                    <label style={ROW} id="newgoal-name">
                        <span>Nombre*:</span>
                        <input
                            style={INPUT}
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            minLength={1}
                            maxLength={50}
                            required
                        />
                    </label>

                    {/* Periodo en UNA línea */}
                    <label style={ROW} id="newgoal-period">
                        <span>Periodo*:</span>
                        <div style={{ ...INLINE }}>
                            <input
                                type="number"
                                style={{ ...INPUT, width: 110, height: 36, opacity: periodoIndef ? 0.55 : 1 }}
                                disabled={periodoIndef}
                                required={!periodoIndef}
                                value={periodoNum}
                                onChange={(e) => setPeriodoNum(e.target.value)}
                                min="1"
                                max="10000"
                                step="1"
                            />
                            <select
                                style={{ ...INPUT, height: 36, opacity: periodoIndef ? 0.55 : 1 }}
                                disabled={periodoIndef}
                                value={periodoUnit}
                                onChange={(e) => setPeriodoUnit(e.target.value)}
                            >
                                <option value="dias">Días</option>
                                <option value="semanas">Semanas</option>
                                <option value="meses">Meses</option>
                                <option value="años">Años</option>
                            </select>

                            <label
                                style={{ display: "flex", gap: ".35rem", alignItems: "center", marginLeft: ".25rem" }}
                            >
                                <input
                                    type="checkbox"
                                    checked={periodoIndef}
                                    onChange={(e) => setPeriodoIndef(e.target.checked)}
                                />
                                Indefinido
                            </label>
                        </div>
                    </label>

                    {/* Objetivo en UNA línea */}
                    <label style={ROW} id="newgoal-obj">
                        <span>Objetivo*:</span>
                        <div style={{ ...INLINE }}>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                disabled={isBool}
                                required={!isBool}
                                value={objetivoNum}
                                onChange={(e) => setObjetivoNum(e.target.value)}
                                style={{ ...INPUT, width: 140, height: 40, boxSizing: "border-box", opacity: isBool ? 0.55 : 1 }}
                            />
                            <input
                                placeholder="unidad*"
                                disabled={isBool}
                                required={!isBool}
                                value={objetivoUnidad}
                                onChange={(e) => setObjetivoUnidad(e.target.value)}
                                maxLength={20}
                                style={{ ...INPUT, width: 140, height: 40, boxSizing: "border-box", opacity: isBool ? 0.55 : 1, transform: "translateY(2px)" }}
                            />

                            <label
                                style={{ display: "flex", gap: ".35rem", alignItems: "center", marginLeft: ".25rem" }}
                            >
                                <input
                                    type="checkbox"
                                    checked={isBool}
                                    onChange={(e) => setIsBool(e.target.checked)}
                                />
                                Check
                            </label>
                        </div>
                    </label>

                    {/* Fecha */}
                    <label style={ROW} id="newgoal-date">
                    <span>Fecha inicio*:</span>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            style={{ ...INPUT, width: "100%" }}
                        />
                    </label>

                    {/* Descripción */}
                    <label style={ROW} id="newgoal-desc">
                    <span>Descripción:</span>
                        <textarea
                            rows={4}
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            maxLength={300}
                            style={{ ...INPUT, resize: "vertical" }}
                        />
                    </label>

                    {/* Acciones: un botón en cada extremo */}
                    <div
                        id="newgoal-actions"
                        className="modal-actions"
                        style={{ justifyContent: "space-between", marginTop: ".4rem" }}
                    >
                    <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: RED,
                                border: `1px solid ${darken(RED)}`,
                                color: "#fff",
                                borderRadius: 999,
                                padding: "8px 14px",
                                boxShadow: "0 2px 6px rgba(0,0,0,.08)",
                            }}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            style={{
                                background: GREEN,
                                border: `1px solid ${darken(GREEN)}`,
                                color: "#fff",
                                borderRadius: 999,
                                padding: "8px 14px",
                                boxShadow: "0 2px 6px rgba(0,0,0,.08)",
                                opacity: canSubmit ? 1 : 0.65,
                            }}
                            title={!canSubmit ? "Rellena los campos obligatorios" : "Crear meta"}
                        >
                            Crear
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
