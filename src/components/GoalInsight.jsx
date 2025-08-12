import React, { useMemo, useState, useRef } from "react";

/**
 * goal.tipo: "Num" | "Bool"
 * goal.registros: [{ fecha: "YYYY-MM-DD", valorNum? , valorBool? }, ...]
 * goal.valorObjetivo (Num), goal.unidad (string)
 * goal.fecha (string, ISO) -> fecha de inicio de la meta
 */
export default function GoalInsight({ goal }) {
    if (!goal) {
        return <div className="insight-empty">Selecciona una meta para ver un resumen aquí.</div>;
    }
    if (!Array.isArray(goal.registros)) {
        return <div className="insight-empty">Cargando registros…</div>;
    }

    return (
        <div className="insight-container">
            {goal.tipo === "Num" ? <NumericChart goal={goal} /> : <BooleanCalendar goal={goal} />}
        </div>
    );
}

/* ---------------------- NUMERIC CHART (SVG) ---------------------- */

function NumericChart({ goal }) {
    const { points, yMin, yMax, labels } = useMemo(() => {
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
            yMin = yMin - 1;
            yMax = yMax + 1;
        }

        const labels = regs.map((r) => r.fecha.slice(5)); // "MM-DD"

        const points = regs.map((r, idx) => ({
            label: labels[idx],
            value: r.valorNum,
        }));

        return { points, yMin, yMax, labels };
    }, [goal]);

    // dimensiones del SVG (con viewBox para ser responsivo)
    const W = 700;
    const H = 260;
    const M = { top: 20, right: 20, bottom: 40, left: 48 };
    const w = W - M.left - M.right;
    const h = H - M.top - M.bottom;

    const x = (i) => (points.length <= 1 ? w / 2 : (i / (points.length - 1)) * w);
    const y = (v) => h - ((v - yMin) / (yMax - yMin)) * h;

    const pathD =
        points.length > 0
            ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${M.left + x(i)} ${M.top + y(p.value)}`).join(" ")
            : "";

    const targetY = goal.valorObjetivo != null ? M.top + y(goal.valorObjetivo) : null;

    // Interacción (hover)
    const svgRef = useRef(null);
    const [hover, setHover] = useState(null); // { i, sx, sy }

    const onMove = (e) => {
        if (!points.length) return;
        const box = svgRef.current.getBoundingClientRect();
        const sx = ((e.clientX - box.left) / box.width) * W; // coord X en viewBox
        let t = (sx - M.left) / (w || 1);
        t = Math.max(0, Math.min(1, t));
        const i = Math.round(t * (points.length - 1));
        const cx = M.left + x(i);
        const cy = M.top + y(points[i].value);
        setHover({ i, sx: cx, sy: cy });
    };

    const onLeave = () => setHover(null);

    const tooltipFor = (p) => {
        const txt = `${p.label}  •  ${roundNicely(p.value)} ${goal.unidad || ""}`.trim();
        const width = 10 + txt.length * 7.2; // estimación suficiente
        return { txt, width, height: 22 };
    };

    return (
        <div className="insight-block">
            <div className="insight-title">Evolución de registros <span className="muted">({goal.unidad || ""})</span></div>

            <svg
                ref={svgRef}
                className="insight-svg"
                viewBox={`0 0 ${700} ${260}`}
                preserveAspectRatio="xMidYMid meet"
                onMouseMove={onMove}
                onMouseLeave={onLeave}
            >
                {/* Fondo */}
                <rect x="0" y="0" width={700} height={260} fill="#fff" rx="10" />

                {/* Eje X */}
                <line x1={M.left} y1={M.top + h} x2={M.left + w} y2={M.top + h} stroke="#ccc" />
                {labels.map((lbl, i) => (
                    <text key={i} x={M.left + x(i)} y={M.top + h + 18} textAnchor="middle" className="tick">
                        {lbl}
                    </text>
                ))}

                {/* Eje Y */}
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
                        <line x1={M.left} y1={targetY} x2={M.left + w} y2={targetY} className="insight-target-line" strokeDasharray="6 6" />
                        <text x={M.left + w - 4} y={targetY - 6} textAnchor="end" className="legend">
                            Objetivo: {roundNicely(goal.valorObjetivo)} {goal.unidad || ""}
                        </text>
                    </>
                )}

                {/* Serie */}
                {points.length > 0 && <path d={pathD} fill="none" stroke="#2e7d32" strokeWidth="2.5" />}

                {/* Puntos */}
                {points.map((p, i) => (
                    <circle key={i} cx={M.left + x(i)} cy={M.top + y(p.value)} r="3.5" fill="#2e7d32" />
                ))}

                {/* Hover */}
                {hover && points[hover.i] && (
                    <>
                        <line className="insight-hover-line" x1={hover.sx} y1={M.top} x2={hover.sx} y2={M.top + h} />
                        <circle className="insight-hover-dot" cx={hover.sx} cy={hover.sy} r="5.5" />

                        {(() => {
                            const p = points[hover.i];
                            const { txt, width, height } = tooltipFor(p);
                            const pad = 6;
                            let tx = hover.sx + 8;
                            let ty = hover.sy - (height + 10);
                            if (ty < 6) ty = hover.sy + 14;
                            if (tx + width > 700 - 4) tx = hover.sx - (width + 8);

                            return (
                                <g className="insight-tooltip">
                                    <rect className="insight-tooltip-bg" x={tx} y={ty} width={width} height={height} rx="4" ry="4" />
                                    <text x={tx + pad} y={ty + height - pad - 2}>{txt}</text>
                                </g>
                            );
                        })()}
                    </>
                )}
            </svg>
        </div>
    );
}

/* ---------------------- BOOLEAN CALENDAR (con navegación) ---------------------- */

function BooleanCalendar({ goal }) {
    // Mapa { 'YYYY-MM-DD': boolean }
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

    // límites de navegación: desde el mes de inicio hasta el mes actual
    const startDate =
        parseISO(goal.fecha) ||
        (goal.registros?.length ? parseISO([...goal.registros].sort((a, b) => a.fecha.localeCompare(b.fecha))[0].fecha) : null) ||
        new Date();

    const today = new Date();
    const minYM = { y: startDate.getFullYear(), m: startDate.getMonth() }; // 0–11
    const maxYM = { y: today.getFullYear(), m: today.getMonth() };

    // vista por defecto: mes actual (clamped)
    const initial = clampYM(maxYM, minYM, maxYM);
    const [ym, setYM] = useState(initial); // { y, m }

    const canPrev = beforeYM(ym, minYM) > 0; // ym > min
    const canNext = beforeYM(maxYM, ym) > 0; // ym < max

    const goPrev = () => setYM((s) => (canPrev ? addMonths(s, -1) : s));
    const goNext = () => setYM((s) => (canNext ? addMonths(s, +1) : s));

    // generar celdas para ym.y/ym.m
    const first = new Date(ym.y, ym.m, 1);
    const firstWeekday = (first.getDay() + 6) % 7; // 0=lunes … 6=domingo
    const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ type: "pad" });
    for (let d = 1; d <= daysInMonth; d++) {
        const iso = toISO(ym.y, ym.m + 1, d);
        const val = map.get(iso);
        cells.push({ type: "day", d, iso, val });
    }
    while (cells.length % 7 !== 0) cells.push({ type: "pad" });

    return (
        <div className="insight-block calendar-block">
            <div className="insight-title bump-up">
                Registros del mes <span className="muted">({fmtMonth(ym.y, ym.m)})</span>
            </div>

            <div className="calendar-legend">
                <span className="dot ok" /> Sí
                <span className="dot ko" /> No
                <span className="dot none" /> Sin registro
            </div>

            <div className="calendar-grid">
                {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                    <div key={d} className="cal-head">{d}</div>
                ))}
                {cells.map((c, i) =>
                    c.type === "pad" ? (
                        <div key={i} className="cal-pad" />
                    ) : (
                        <div
                            key={i}
                            className={"cal-day " + (c.val === true ? "ok" : c.val === false ? "ko" : "none")}
                            title={`${c.iso} — ${c.val === true ? "Sí" : c.val === false ? "No" : "Sin registro"}`}
                        >
                            {c.d}
                        </div>
                    )
                )}
            </div>

            {/* Navegación: centrada justo debajo del grid */}
            <div className="calendar-nav">
                <button className="cal-nav-btn" onClick={goPrev} disabled={!canPrev} aria-label="Mes anterior">‹</button>
                <button className="cal-nav-btn" onClick={goNext} disabled={!canNext} aria-label="Mes siguiente">›</button>
            </div>
        </div>
    );
}

/* ---------------------- helpers ---------------------- */

function roundNicely(n) {
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
function parseISO(s) {
    if (!s) return null;
    const t = typeof s === "string" ? s.slice(0, 10) : "";
    const [y, m, d] = t.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}
function fmtMonth(y, m) {
    const names = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    return `${names[m]} ${y}`;
}

// utilidades de año/mes
function addMonths({ y, m }, delta) {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
}
function beforeYM(a, b) {
    // >0 si a > b; 0 si igual; <0 si a < b
    return a.y !== b.y ? a.y - b.y : a.m - b.m;
}
function clampYM(v, min, max) {
    if (beforeYM(v, min) < 0) return { ...min };
    if (beforeYM(v, max) > 0) return { ...max };
    return v;
}
