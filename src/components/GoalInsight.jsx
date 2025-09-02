// src/components/GoalInsight.jsx
import React, { useMemo, useState, useRef } from "react";
import flameGIF from "../assets/icons/flame.gif";

/* ---------------------- helpers ---------------------- */

function roundNicely(n) {
    const abs = Math.abs(n);
    if (abs >= 1000) return n.toFixed(0);
    if (abs >= 100) return n.toFixed(1);
    if (abs >= 10) return n.toFixed(1);
    if (abs >= 1) return n.toFixed(2);
    return n.toFixed(3);
}

const MONTHS = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

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
function fmtMonth(y, m) { return `${MONTHS[m]} ${y}`; }
function fmtDDMM(iso) { return `${iso.slice(8,10)}/${iso.slice(5,7)}`; }
function fmtDDMMYYYY(iso) { return `${iso.slice(8,10)}/${iso.slice(5,7)}/${iso.slice(0,4)}`; }

// utilidades de año/mes
function addMonths({ y, m }, delta) {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
}
function beforeYM(a, b) { return a.y !== b.y ? a.y - b.y : a.m - b.m; }
function clampYM(v, min, max) {
    if (beforeYM(v, min) < 0) return { ...min };
    if (beforeYM(v, max) > 0) return { ...max };
    return v;
}

// ── semanas del mes (lunes inicio) ──
function weekCountInMonth(year, month1) {
    const y = year, m0 = month1 - 1;
    const first = new Date(y, m0, 1);
    const firstWeekday = (first.getDay() + 6) % 7; // 0=lun..6=dom
    const days = new Date(y, m0 + 1, 0).getDate();
    return Math.ceil((firstWeekday + days) / 7);
}
// ── rango de la semana N (1..sem) de un mes, con semanas que empiezan en LUNES ──
function weekRangeOfMonth(year, month1, weekIndex) {
    const y = year, m0 = month1 - 1;
    const first = new Date(y, m0, 1);
    const daysInMonth = new Date(y, m0 + 1, 0).getDate();
    const firstWeekday = (first.getDay() + 6) % 7;
    const firstMonday = firstWeekday === 0 ? 1 : (8 - firstWeekday);

    let startDay, endDay;
    if (firstMonday === 1) {
        startDay = 1 + 7 * (weekIndex - 1);
        endDay   = Math.min(daysInMonth, startDay + 6);
    } else if (weekIndex === 1) {
        startDay = 1;
        endDay   = Math.min(daysInMonth, firstMonday - 1);
    } else {
        startDay = firstMonday + 7 * (weekIndex - 2);
        endDay   = Math.min(daysInMonth, startDay + 6);
    }
    if (startDay > daysInMonth) { startDay = daysInMonth; endDay = daysInMonth; }

    return { start: toISO(y, month1, startDay), end: toISO(y, month1, endDay) };
}

function computePeriodRange(mode, year, month1, weekIndex) {
    if (mode === "anio")   return { start: toISO(year, 1, 1), end: toISO(year, 12, 31) };
    if (mode === "mes")    return { start: toISO(year, month1, 1), end: toISO(year, month1, new Date(year, month1, 0).getDate()) };
    if (mode === "semana") return weekRangeOfMonth(year, month1, weekIndex);
    return { start: "0000-01-01", end: "9999-12-31" };
}
function intersectRanges(a, b) {
    const start = a.start > b.start ? a.start : b.start;
    const end   = a.end   < b.end   ? a.end   : b.end;
    if (end < start) return { start, end: start };
    return { start, end };
}
function maxISODate(a, b) { return a > b ? a : b; }
function minISODate(a, b) { return a < b ? a : b; }
function diffDaysISO(a, b) {
    const da = parseISO(a), db = parseISO(b);
    return Math.floor((db - da) / 86400000);
}
function firstOfNextMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 1); }
function isoFromDate(d) { return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
function nextMonday(date) {
    const day = date.getDay(); // 0 dom .. 6 sab
    const delta = (1 - day + 7) % 7 || 7; // siguiente lunes (si ya es lunes, +7)
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    return d;
}

/* ---------------------- componente público ---------------------- */

export default function GoalInsight({ goal }) {
    if (!goal) return <div className="insight-empty">Selecciona una meta para ver un resumen aquí.</div>;
    if (!Array.isArray(goal.registros)) return <div className="insight-empty">Cargando registros…</div>;

    return (
        <div className="insight-container" id="tour-insight">
            {goal.tipo === "Num" ? <NumericChart goal={goal} /> : <BooleanCalendar goal={goal} />}
        </div>
    );
}

/* ---------------------- NUMERIC CHART (SVG) + FILTROS ---------------------- */

function NumericChart({ goal }) {
    // límites de dominio: inicio = creación; fin = estadisticas.fechaFin (o hoy si no viene)
    const minDate =
        parseISO(goal.fecha) ||
        (goal.registros?.length
            ? parseISO([...goal.registros].sort((a, b) => a.fecha.localeCompare(b.fecha))[0].fecha)
            : null) ||
        new Date();

    const statsEnd = parseISO(goal.estadisticas?.fechaFin);
    const endDate = statsEnd || new Date();

    const minISO = isoFromDate(minDate);
    const maxISO = isoFromDate(endDate);

    const isNumIndef =
        String(goal.tipo).toLowerCase() === "num" &&
        String(goal.duracionUnidad || "").toLowerCase().startsWith("indef");

    // hoy (para valores por defecto en “Rango manual”)
    const today = new Date();
    const todayISO = isoFromDate(today);
    const defaultToISO = todayISO > maxISO ? maxISO : todayISO;

    // Filtro activo (excluyente) — por defecto: RANGO MANUAL
    const [activeFilter, setActiveFilter] = useState("rango"); // 'rango' | 'periodo' | 'registros'

    // 1) periodo
    const [periodMode, setPeriodMode] = useState("none"); // 'none' | 'semana' | 'mes' | 'anio'
    const [selYear, setSelYear] = useState(endDate.getFullYear());
    const [selMonth, setSelMonth] = useState(endDate.getMonth() + 1);
    const [selWeek, setSelWeek] = useState(1);

    // 2) primeros/últimos X
    const [whichEdge, setWhichEdge] = useState("ultimos"); // 'primeros' | 'ultimos'
    const [edgeCount, setEdgeCount] = useState("");

    // 3) rango manual — en indefinido: solo tope inferior
    const [fromISO, setFromISO] = useState(minISO);
    const [toISOValue, setToISOValue] = useState(defaultToISO);

    // años válidos (hasta maxISO; en indefinidas usamos hoy como techo visual)
    const yearMin = minDate.getFullYear();
    const yearMax = endDate.getFullYear();
    const years = useMemo(() => {
        const a = [];
        for (let y = yearMin; y <= yearMax; y++) a.push(y);
        return a;
    }, [yearMin, yearMax]);

    const weeksInSelMonth = useMemo(() => weekCountInMonth(selYear, selMonth), [selYear, selMonth]);

    // aplicar SOLO el filtro activo
    const regsFiltered = useMemo(() => {
        const regsAsc = [...goal.registros]
            .filter((r) => typeof r.valorNum === "number" && typeof r.fecha === "string")
            .sort((a, b) => a.fecha.localeCompare(b.fecha));

        let out = regsAsc;

        if (activeFilter === "periodo") {
            if (periodMode !== "none") {
                const pr = computePeriodRange(periodMode, selYear, selMonth, selWeek);
                const prClamped = intersectRanges({ start: minISO, end: maxISO }, pr);
                out = regsAsc.filter((r) => r.fecha >= prClamped.start && r.fecha <= prClamped.end);
            } else {
                out = regsAsc.filter((r) => r.fecha >= minISO && r.fecha <= maxISO);
            }
        }

        if (activeFilter === "rango") {
            let start = fromISO ? maxISODate(fromISO, minISO) : minISO;
            // en indefinidas no imponemos tope superior, solo respetamos start<=end
            let end   = toISOValue || maxISO;
            if (!isNumIndef) end = minISODate(end, maxISO);
            if (end < start) end = start;
            out = regsAsc.filter((r) => r.fecha >= start && r.fecha <= end);
        }

        if (activeFilter === "registros") {
            const n = Number(edgeCount);
            if (Number.isInteger(n) && n > 0 && regsAsc.length > n) {
                out = whichEdge === "primeros" ? regsAsc.slice(0, n) : regsAsc.slice(-n);
            } else {
                out = regsAsc;
            }
        }

        return out;
    }, [
        goal, activeFilter,
        // periodo
        periodMode, selYear, selMonth, selWeek, minISO, maxISO,
        // rango
        fromISO, toISOValue, isNumIndef,
        // registros
        whichEdge, edgeCount
    ]);

    // ——— puntos y fechas ———
    const isoDates = useMemo(() => regsFiltered.map((r) => r.fecha), [regsFiltered]);
    const { points, yMin, yMax } = useMemo(() => {
        const values = regsFiltered.map((r) => r.valorNum);
        const target = typeof goal.valorObjetivo === "number" ? goal.valorObjetivo : null;
        let yMin = Math.min(...values, ...(target != null ? [target] : []));
        let yMax = Math.max(...values, ...(target != null ? [target] : []));
        if (!isFinite(yMin) || !isFinite(yMax)) { yMin = 0; yMax = 1; }
        if (yMin === yMax) { yMin = yMin - 1; yMax = yMax + 1; }

        const points = regsFiltered.map((r) => ({ value: r.valorNum }));
        return { points, yMin, yMax };
    }, [regsFiltered, goal]);

    // ——— rango mostrado (SIEMPRE, aunque no haya puntos) ———
    const displayedRange = useMemo(() => {
        if (activeFilter === "rango") {
            const start = fromISO ? maxISODate(fromISO, minISO) : minISO;
            let end = toISOValue || maxISO;
            if (!isNumIndef) end = minISODate(end, maxISO);
            if (end < start) return { start, end: start };
            return { start, end };
        }

        if (activeFilter === "periodo") {
            if (periodMode === "none") {
                return { start: minISO, end: maxISO };
            }
            // mostrar SIEMPRE el rango del periodo completo (no recortado)
            const pr = computePeriodRange(periodMode, selYear, selMonth, selWeek);
            return pr;
        }

        // registros: por las fechas reales (si no hay, mostramos dominio completo)
        if (isoDates.length > 0) {
            return { start: isoDates[0], end: isoDates[isoDates.length - 1] };
        }
        return { start: minISO, end: maxISO };
    }, [activeFilter, periodMode, selYear, selMonth, selWeek, fromISO, toISOValue, minISO, maxISO, isoDates, isNumIndef]);

    // ——— ticks del eje X (adaptativos) ———
    const tickIndices = useMemo(() => {
        if (isoDates.length === 0) return [];

        // mapa fecha->indice
        const idxByISO = new Map();
        isoDates.forEach((iso, i) => { if (!idxByISO.has(iso)) idxByISO.set(iso, i); });
        const collect = (set, iso) => {
            const idx = idxByISO.get(iso);
            if (idx != null) set.add(idx);
        };
        const all = () => isoDates.map((_, i) => i);

        const weeklyTicks = (aISO, bISO) => {
            const res = new Set();
            res.add(0); res.add(isoDates.length - 1);
            collect(res, aISO);
            let cursor = nextMonday(parseISO(aISO));
            const endD = parseISO(bISO);
            while (cursor <= endD) {
                collect(res, isoFromDate(cursor));
                cursor.setDate(cursor.getDate() + 7);
            }
            collect(res, bISO);
            return Array.from(res).sort((x, y) => x - y);
        };
        const monthlyTicks = (aISO, bISO) => {
            const res = new Set();
            res.add(0); res.add(isoDates.length - 1);
            collect(res, aISO);
            let cursor = firstOfNextMonth(parseISO(aISO));
            const endD = parseISO(bISO);
            while (cursor <= endD) {
                collect(res, isoFromDate(cursor));
                cursor = firstOfNextMonth(cursor);
            }
            collect(res, bISO);
            return Array.from(res).sort((x, y) => x - y);
        };

        if (activeFilter === "rango") {
            const a = fromISO ? maxISODate(fromISO, minISO) : minISO;
            let b = toISOValue || maxISO;
            if (!isNumIndef) b = minISODate(b, maxISO);
            const span = diffDaysISO(a, b);
            if (span <= 14) return all();
            if (span > 61) return monthlyTicks(a, b);
            return weeklyTicks(a, b);
        }

        if (activeFilter === "registros") {
            const a = isoDates[0];
            const b = isoDates[isoDates.length - 1];
            const span = diffDaysISO(a, b);
            if (span <= 14) return all();
            if (span > 61) return monthlyTicks(a, b);
            return weeklyTicks(a, b);
        }

        // PERIODO
        if (activeFilter === "periodo") {
            if (periodMode === "none") {
                const a = minISO, b = maxISO;
                const span = diffDaysISO(a, b);
                if (span <= 14) return all();
                if (span > 61) return monthlyTicks(a, b);
                return weeklyTicks(a, b);
            }
            const pr = computePeriodRange(periodMode, selYear, selMonth, selWeek);
            const { start: a, end: b } = intersectRanges({ start: minISO, end: maxISO }, pr);

            if (periodMode === "semana") {
                // semana: todos los días dentro del tramo visible
                return isoDates
                    .map((iso, i) => ({ iso, i }))
                    .filter(({ iso }) => iso >= a && iso <= b)
                    .map(({ i }) => i);
            }
            if (periodMode === "mes") {
                return weeklyTicks(a, b);
            }
            return monthlyTicks(a, b);
        }

        return all();
    }, [activeFilter, periodMode, selYear, selMonth, selWeek, isoDates, fromISO, toISOValue, minISO, maxISO, isNumIndef]);

    // SVG + hover
    const W = 700, H = 260;
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

    const svgRef = useRef(null);
    const [hover, setHover] = useState(null);
    const onMove = (e) => {
        if (!points.length) return;
        const box = svgRef.current.getBoundingClientRect();
        const sx = ((e.clientX - box.left) / box.width) * W;
        let t = (sx - M.left) / (w || 1);
        t = Math.max(0, Math.min(1, t));
        const i = Math.round(t * (points.length - 1));
        const cx = M.left + x(i);
        const cy = M.top + y(points[i].value);
        setHover({ i, sx: cx, sy: cy });
    };
    const onLeave = () => setHover(null);

    const tooltipText = (i) => {
        const iso = isoDates[i];
        const val = points[i]?.value;
        const txt = `${fmtDDMM(iso)}  •  ${roundNicely(val)} ${goal.unidad || ""}`.trim();
        return txt;
    };

    const changeCount = (v) => {
        if (v === "") return setEdgeCount("");
        const n = Math.max(1, Math.floor(Number(v) || 0));
        setEdgeCount(String(n));
    };

    // corregir semana fuera de rango al cambiar de mes/año
    React.useEffect(() => {
        const weeks = weekCountInMonth(selYear, selMonth);
        if (periodMode === "semana" && selWeek > weeks) setSelWeek(weeks);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selMonth, selYear, periodMode]);

    // utilidades para deshabilitar meses anteriores al inicio
    const minMonthForYear = selYear === yearMin ? (minDate.getMonth() + 1) : 1;

    return (
        <div className="insight-block">
            {/* Título + rango visible a la derecha */}
            <div className="insight-title bump-up" style={{ display: "flex", alignItems: "center" }}>
        <span>
          Evolución de registros <span className="muted">({goal.unidad || ""})</span>
        </span>
                {displayedRange && (
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}>
            Mostrando de {fmtDDMMYYYY(displayedRange.start)} hasta {fmtDDMMYYYY(displayedRange.end)}
          </span>
                )}
            </div>

            <svg
                ref={svgRef}
                className="insight-svg bump-up"
                viewBox={`0 0 ${700} ${260}`}
                preserveAspectRatio="xMidYMid meet"
                onMouseMove={onMove}
                onMouseLeave={onLeave}
            >
                <rect x="0" y="0" width={700} height={260} fill="#fff" rx="10" />

                {/* Eje X */}
                <line x1={M.left} y1={M.top + h} x2={M.left + w} y2={M.top + h} stroke="#ccc" />

                {/* Ticks X */}
                {tickIndices.map((idx) => (
                    <text key={`tick-${idx}`} x={M.left + x(idx)} y={M.top + h + 18} textAnchor="middle" className="tick">
                        {fmtDDMM(isoDates[idx])}
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
                            const txt = tooltipText(hover.i);
                            const width = 10 + txt.length * 7.2;
                            const height = 22, pad = 6;
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

            {/* ─── Barra de filtros ─── */}
            <div className="filterbar">
                <div className="filter-chooser">
                    <div className="filter-chooser-title">Filtrar por:</div>
                    <label className="radio-line">
                        <input type="radio" name="insightFilter" checked={activeFilter === "rango"} onChange={() => setActiveFilter("rango")} />
                        <span>Rango manual</span>
                    </label>
                    <label className="radio-line">
                        <input type="radio" name="insightFilter" checked={activeFilter === "periodo"} onChange={() => setActiveFilter("periodo")} />
                        <span>Periodo</span>
                    </label>
                    <label className="radio-line">
                        <input type="radio" name="insightFilter" checked={activeFilter === "registros"} onChange={() => setActiveFilter("registros")} />
                        <span>Nº de registros</span>
                    </label>
                </div>

                <div className="filter-controls">
                    {activeFilter === "rango" && (
                        <div className="filter-row">
                            <input
                                className="filter-input"
                                type="date"
                                value={fromISO}
                                min={minISO}
                                // en indefinidas, sin tope superior para inicio
                                onChange={(e) => setFromISO(e.target.value)}
                                title="Fecha inicio (incluida)"
                            />
                            <span className="filter-sep">—</span>
                            <input
                                className="filter-input"
                                type="date"
                                value={toISOValue}
                                min={fromISO || minISO}
                                // en indefinidas no imponemos max
                                max={isNumIndef ? undefined : maxISO}
                                onChange={(e) => setToISOValue(e.target.value)}
                                title="Fecha fin (incluida)"
                            />
                            {(fromISO !== minISO || toISOValue !== defaultToISO) && (
                                <button className="filter-clear" onClick={() => { setFromISO(minISO); setToISOValue(defaultToISO); }}>
                                    Limpiar
                                </button>
                            )}
                            <div className="filter-hint">
                                {isNumIndef ? <>A partir de {minISO}.</> : <>Inicio ≥ {minISO} y fin ≤ {maxISO}.</>}
                            </div>
                        </div>
                    )}

                    {activeFilter === "periodo" && (
                        <div className="filter-row">
                            <select
                                className="filter-select"
                                value={periodMode}
                                onChange={(e) => setPeriodMode(e.target.value)}
                                title="Tipo de periodo"
                            >
                                <option value="none">Sin filtro</option>
                                <option value="semana">Semana</option>
                                <option value="mes">Mes</option>
                                <option value="anio">Año</option>
                            </select>

                            <select
                                className="filter-select short"
                                value={selYear}
                                onChange={(e) => setSelYear(Number(e.target.value))}
                                title="Año"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>

                            {(periodMode === "semana" || periodMode === "mes") && (
                                <select
                                    className="filter-select medium"
                                    value={selMonth}
                                    onChange={(e) => setSelMonth(Number(e.target.value))}
                                    title="Mes"
                                >
                                    {MONTHS.map((m, i) => {
                                        const monthValue = i + 1;
                                        const disabled = selYear === yearMin && monthValue < minMonthForYear;
                                        return <option key={i} value={monthValue} disabled={disabled}>{m}</option>;
                                    })}
                                </select>
                            )}

                            {periodMode === "semana" && (
                                <select
                                    className="filter-select short"
                                    value={selWeek}
                                    onChange={(e) => setSelWeek(Number(e.target.value))}
                                    title="Semana del mes"
                                >
                                    {Array.from({ length: weeksInSelMonth }).map((_, i) => {
                                        const num = i + 1;
                                        // opcional: deshabilitar semanas totalmente anteriores al inicio cuando coincide año/mes
                                        let disabled = false;
                                        if (selYear === yearMin && selMonth === (minDate.getMonth() + 1)) {
                                            const r = weekRangeOfMonth(selYear, selMonth, num);
                                            if (r.end < minISO) disabled = true;
                                        }
                                        const text = num === weeksInSelMonth ? "Última semana" : `${num}º Semana`;
                                        return <option key={num} value={num} disabled={disabled}>{text}</option>;
                                    })}
                                </select>
                            )}

                            <div className="filter-hint">
                                {isNumIndef ? <>A partir de {minISO}.</> : <>Dentro de {minISO} a {maxISO}.</>}
                            </div>
                        </div>
                    )}

                    {activeFilter === "registros" && (
                        <div className="filter-row">
                            <input
                                className="filter-input short"
                                type="number"
                                min="1"
                                step="1"
                                placeholder="n"
                                value={edgeCount}
                                onChange={(e) => changeCount(e.target.value)}
                                title="Número natural"
                            />
                            <select
                                className="filter-select medium"
                                value={whichEdge}
                                onChange={(e) => setWhichEdge(e.target.value)}
                                title="Tipo"
                            >
                                <option value="ultimos">Últimos</option>
                                <option value="primeros">Primeros</option>
                            </select>
                            <div className="filter-hint">De la selección actual.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------------------- Calendario Bool (Indef: hasta mes actual o hasta mes del último registro si es posterior) ---------------------- */

function BooleanCalendar({ goal }) {
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

    const startDate =
        parseISO(goal.fecha) ||
        (goal.registros?.length
            ? parseISO([...goal.registros].sort((a, b) => a.fecha.localeCompare(b.fecha))[0].fecha)
            : null) ||
        new Date();

    // Base para casos NO indefinidos: estadisticas.fechaFin o hoy
    const statsEnd = parseISO(goal.estadisticas?.fechaFin);
    const baseEnd = statsEnd || new Date();

    const minYM = { y: startDate.getFullYear(), m: startDate.getMonth() };

    // Para Bool + Indefinido → hasta el mes actual,
    // pero si el último registro está en un mes posterior, usar ese mes.
    const isIndef = String(goal.duracionUnidad || "").toLowerCase().startsWith("indef");
    const today = new Date();
    let maxYM = { y: baseEnd.getFullYear(), m: baseEnd.getMonth() };

    if (goal.tipo === "Bool" && isIndef) {
        maxYM = { y: today.getFullYear(), m: today.getMonth() };
        if (Array.isArray(goal.registros) && goal.registros.length) {
            const latestISO = goal.registros.reduce(
                (max, r) => (r?.fecha > max ? r.fecha : max),
                goal.registros[0].fecha
            );
            const latest = parseISO(latestISO);
            if (latest) {
                const latestYM = { y: latest.getFullYear(), m: latest.getMonth() };
                if (beforeYM(latestYM, maxYM) > 0) maxYM = latestYM;
            }
        }
    }

    // por defecto: mes del día actual (clampeado a [minYM, maxYM])
    const initial = clampYM({ y: today.getFullYear(), m: today.getMonth() }, minYM, maxYM);

    const [ym, setYM] = useState(initial);
    const canPrev = beforeYM(ym, minYM) > 0;
    const canNext = beforeYM(maxYM, ym) > 0;

    const goPrev = () => setYM((s) => (canPrev ? addMonths(s, -1) : s));
    const goNext = () => setYM((s) => (canNext ? addMonths(s, +1) : s));

    const first = new Date(ym.y, ym.m, 1);
    const firstWeekday = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ type: "pad" });
    for (let d = 1; d <= daysInMonth; d++) {
        const iso = toISO(ym.y, ym.m + 1, d);
        const val = map.get(iso);
        cells.push({ type: "day", d, iso, val });
    }
    while (cells.length % 7 !== 0) cells.push({ type: "pad" });

    // ---- cálculo de racha (streak) ----
    const streak = useMemo(() => {
        // si no hay registros válidos, no mostramos nada
        const keys = Array.from(map.keys());
        if (keys.length === 0) return null;

        // último registro (ISO mayor)
        const latestISO = keys.reduce((max, k) => (k > max ? k : max), keys[0]);
        const lastVal = map.get(latestISO);
        if (typeof lastVal !== "boolean") return null;

        let count = 0;
        let cursor = parseISO(latestISO);
        const wanted = lastVal;
        while (true) {
            const iso = isoFromDate(cursor);
            const v = map.get(iso);
            if (v === wanted) {
                count += 1;
                // avanzar un día hacia atrás
                cursor.setDate(cursor.getDate() - 1);
            } else {
                break; // distinto estado o día sin registro → fin de racha
            }
        }

        return {
            label: wanted ? "Sí" : "No",
            count
        };
    }, [map]);

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

            <div className="calendar-nav">
                <button className="cal-nav-btn" onClick={goPrev} disabled={!canPrev} aria-label="Mes anterior">‹</button>
                <button className="cal-nav-btn" onClick={goNext} disabled={!canNext} aria-label="Mes siguiente">›</button>
            </div>

            {/* Racha */}
            {streak && (
                <div
                    className="streak-row"
                    style={{
                        marginTop: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#333"
                    }}
                >
                    <span>Llevas una racha de</span>
                    <strong>{streak.label}</strong>
                    <span
                        className="streak-badge"
                        aria-label={`Racha de ${streak.count} días`}
                        style={{ position: "relative", display: "inline-block", width: 26, height: 26, verticalAlign: "middle" }}
                    >
                        <img
                            src={flameGIF}
                            alt=""
                            aria-hidden="true"
                            style={{ width: "100%", height: "100%", opacity: 0.5 }}
                        />
                        <span
                            className="streak-count"
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700
                            }}
                        >
                            {streak.count}
                        </span>
                    </span>
                    <span>días</span>
                </div>
            )}
        </div>
    );
}
