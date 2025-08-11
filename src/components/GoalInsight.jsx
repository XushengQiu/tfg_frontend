import React, { useMemo } from "react";

/**
 * goal.tipo: "Num" | "Bool"
 * goal.registros: [{ fecha: "YYYY-MM-DD", valorNum? , valorBool? }, ...]
 * goal.valorObjetivo (Num), goal.unidad (Num)
 */
export default function GoalInsight({ goal }) {
    if (!goal) {
        return (
            <div className="insight-empty">
                Selecciona una meta para ver un resumen aquí.
            </div>
        );
    }

    if (!Array.isArray(goal.registros)) {
        return <div className="insight-empty">Cargando registros…</div>;
    }

    return (
        <div className="insight-container">
            {goal.tipo === "Num" ? (
                <NumericChart goal={goal} />
            ) : (
                <BooleanCalendar goal={goal} />
            )}
        </div>
    );
}

/* ---------------------- NUMERIC CHART (SVG) ---------------------- */

function NumericChart({ goal }) {
    const { points, yMin, yMax, target, unit, labels } = useMemo(() => {
        const regs = [...goal.registros]
            .filter((r) => typeof r.valorNum === "number")
            .sort((a, b) => a.fecha.localeCompare(b.fecha));

        const values = regs.map((r) => r.valorNum);
        const target = typeof goal.valorObjetivo === "number" ? goal.valorObjetivo : null;

        let yMin = Math.min(...values, ...(target != null ? [target] : []));
        let yMax = Math.max(...values, ...(target != null ? [target] : []));

        if (!isFinite(yMin) || !isFinite(yMax)) {
            yMin = 0;
            yMax = 1;
        }
        if (yMin === yMax) {
            // evita rango 0
            yMin = yMin - 1;
            yMax = yMax + 1;
        }

        const labels = regs.map((r) => r.fecha.slice(5)); // "MM-DD" para el eje X
        const unit = goal.unidad || "";

        // coordenadas en espacio interno del gráfico (sin margen)
        const points = regs.map((r, idx) => ({
            label: labels[idx],
            value: r.valorNum,
        }));

        return { points, yMin, yMax, target, unit, labels };
    }, [goal]);

    // dimensiones del SVG (responsivo con viewBox)
    const W = 700;
    const H = 260;
    const M = { top: 20, right: 20, bottom: 40, left: 48 };
    const w = W - M.left - M.right;
    const h = H - M.top - M.bottom;

    const x = (i) =>
        points.length <= 1 ? w / 2 : (i / (points.length - 1)) * w;

    const y = (v) => h - ((v - yMin) / (yMax - yMin)) * h;

    const pathD =
        points.length > 0
            ? points
                .map((p, i) => `${i === 0 ? "M" : "L"} ${M.left + x(i)} ${M.top + y(p.value)}`)
                .join(" ")
            : "";

    const targetY = goal.valorObjetivo != null ? M.top + y(target) : null;

    return (
        <div className="insight-block">
            <div className="insight-title">
                Evolución de registros <span className="muted">({unit})</span>
            </div>

            <svg className="insight-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                {/* Área de ejes */}
                <rect x="0" y="0" width={W} height={H} fill="white" rx="10" />

                {/* Eje X */}
                <line
                    x1={M.left}
                    y1={M.top + h}
                    x2={M.left + w}
                    y2={M.top + h}
                    stroke="#ccc"
                />
                {/* Etiquetas X */}
                {labels.map((lbl, i) => (
                    <text
                        key={i}
                        x={M.left + x(i)}
                        y={M.top + h + 18}
                        textAnchor="middle"
                        className="tick"
                    >
                        {lbl}
                    </text>
                ))}

                {/* Eje Y (marcas 4) */}
                {Array.from({ length: 5 }).map((_, i) => {
                    const v = yMin + ((yMax - yMin) * i) / 4;
                    const yy = M.top + y(v);
                    return (
                        <g key={i}>
                            <line x1={M.left} y1={yy} x2={M.left + w} y2={yy} stroke="#f0f0f0" />
                            <text x={M.left - 6} y={yy + 4} textAnchor="end" className="tick">
                                {roundNicely(v)}
                            </text>
                        </g>
                    );
                })}

                {/* Línea objetivo */}
                {targetY != null && (
                    <>
                        <line
                            x1={M.left}
                            y1={targetY}
                            x2={M.left + w}
                            y2={targetY}
                            stroke="#7a9cff"
                            strokeDasharray="6 6"
                        />
                        <text x={M.left + w - 4} y={targetY - 6} textAnchor="end" className="legend">
                            Objetivo: {roundNicely(target)} {unit}
                        </text>
                    </>
                )}

                {/* Polilínea de datos */}
                {points.length > 0 && (
                    <path d={pathD} fill="none" stroke="#2e7d32" strokeWidth="2.5" />
                )}

                {/* Puntos */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={M.left + x(i)}
                        cy={M.top + y(p.value)}
                        r="3.5"
                        fill="#2e7d32"
                    />
                ))}
            </svg>
        </div>
    );
}

/* ---------------------- BOOLEAN CALENDAR ---------------------- */

function BooleanCalendar({ goal }) {
    // mapa { 'YYYY-MM-DD': true|false }
    const map = useMemo(() => {
        const m = new Map();
        for (const r of goal.registros || []) {
            if (r && typeof r.fecha === "string") {
                const key = r.fecha.slice(0, 10);
                if (typeof r.valorBool === "boolean") m.set(key, r.valorBool);
            }
        }
        return m;
    }, [goal]);

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0–11

    // primer día del mes + cuántos días tiene
    const first = new Date(year, month, 1);
    const firstWeekday = (first.getDay() + 6) % 7; // convertir a 0=lunes … 6=domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    // huecos antes del 1
    for (let i = 0; i < firstWeekday; i++) cells.push({ type: "pad" });
    // días reales del mes
    for (let d = 1; d <= daysInMonth; d++) {
        const iso = toISO(year, month + 1, d);
        const val = map.get(iso);
        cells.push({ type: "day", d, iso, val });
    }
    // completar hasta múltiplo de 7
    while (cells.length % 7 !== 0) cells.push({ type: "pad" });

    return (
        <div className="insight-block">
            <div className="insight-title">
                Registros del mes actual <span className="muted">({fmtMonth(year, month)})</span>
            </div>

            <div className="calendar-legend">
                <span className="dot ok" /> Sí
                <span className="dot ko" /> No
                <span className="dot none" /> Sin registro
            </div>

            <div className="calendar-grid">
                {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                    <div key={d} className="cal-head">
                        {d}
                    </div>
                ))}
                {cells.map((c, i) =>
                    c.type === "pad" ? (
                        <div key={i} className="cal-pad" />
                    ) : (
                        <div
                            key={i}
                            className={
                                "cal-day " +
                                (c.val === true ? "ok" : c.val === false ? "ko" : "none")
                            }
                            title={`${c.iso} — ${
                                c.val === true ? "Sí" : c.val === false ? "No" : "Sin registro"
                            }`}
                        >
                            {c.d}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

/* ---------------------- helpers ---------------------- */

function roundNicely(n) {
    // redondeo “bonito”
    const abs = Math.abs(n);
    if (abs >= 1000) return n.toFixed(0);
    if (abs >= 100) return n.toFixed(1);
    if (abs >= 10) return n.toFixed(1);
    if (abs >= 1) return n.toFixed(2);
    return n.toFixed(3);
}

function toISO(y, m, d) {
    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
}

function fmtMonth(y, m) {
    const names = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];
    return `${names[m]} ${y}`;
}
