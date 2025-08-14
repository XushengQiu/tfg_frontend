import React, { useMemo, useState, useRef } from "react";

/* ---------------------- helpers ---------------------- */

function roundNicely(n) {
    const abs = Math.abs(n);
    if (abs >= 1000) return n.toFixed(0);
    if (abs >= 100) return n.toFixed(1);
    if (abs >= 10) return n.toFixed(1);
    if (abs >= 1) return n.toFixed(2);
    return n.toFixed(3);
}

const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

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
    return `${MONTHS[m]} ${y}`;
}

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

// ── week-of-month helpers (lunes inicio) ──
function weekCountInMonth(year, month1) {
    const y = year, m0 = month1 - 1;
    const first = new Date(y, m0, 1);
    const firstWeekday = (first.getDay() + 6) % 7; // 0=lun..6=dom
    const days = new Date(y, m0 + 1, 0).getDate();
    return Math.ceil((firstWeekday + days) / 7);
}
function weekRangeOfMonth(year, month1, weekIndex) {
    const y = year, m0 = month1 - 1;
    const first = new Date(y, m0, 1);
    const firstWeekday = (first.getDay() + 6) % 7;
    const days = new Date(y, m0 + 1, 0).getDate();
    let startDay = 1 - firstWeekday + 7 * (weekIndex - 1);
    if (startDay < 1) startDay = 1;
    let endDay = startDay + 6;
    if (endDay > days) endDay = days;
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

/* ---------------------- componente público ---------------------- */

export default function GoalInsight({ goal }) {
    if (!goal) return <div className="insight-empty">Selecciona una meta para ver un resumen aquí.</div>;
    if (!Array.isArray(goal.registros)) return <div className="insight-empty">Cargando registros…</div>;

    return (
        <div className="insight-container">
            {goal.tipo === "Num" ? <NumericChart goal={goal} /> : <BooleanCalendar goal={goal} />}
        </div>
    );
}

/* ---------------------- NUMERIC CHART (SVG) + FILTROS ---------------------- */

function NumericChart({ goal }) {
    // límites válidos
    const minDate =
        parseISO(goal.fecha) ||
        (goal.registros?.length
            ? parseISO([...goal.registros].sort((a, b) => a.fecha.localeCompare(b.fecha))[0].fecha)
            : null) ||
        new Date();
    const today = new Date();
    const minISO = toISO(minDate.getFullYear(), minDate.getMonth() + 1, minDate.getDate());
    const maxISO = toISO(today.getFullYear(), today.getMonth() + 1, today.getDate());

    // ⬅️ filtro activo (excluyente) — por defecto: RANGO MANUAL
    const [activeFilter, setActiveFilter] = useState("rango"); // 'rango' | 'periodo' | 'registros'

    // 1) periodo
    const [periodMode, setPeriodMode] = useState("none"); // 'none' | 'semana' | 'mes' | 'anio'
    const [selYear, setSelYear] = useState(today.getFullYear());
    const [selMonth, setSelMonth] = useState(today.getMonth() + 1);
    const [selWeek, setSelWeek] = useState(1);

    // 2) primeros/últimos X
    const [whichEdge, setWhichEdge] = useState("ultimos"); // 'primeros' | 'ultimos'
    const [edgeCount, setEdgeCount] = useState("");

    // 3) rango manual
    const [fromISO, setFromISO] = useState(minISO);
    const [toISOValue, setToISOValue] = useState(maxISO);

    // años válidos
    const yearMin = minDate.getFullYear();
    const yearMax = today.getFullYear();
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
            let end   = toISOValue ? minISODate(toISOValue, maxISO) : maxISO;
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
        fromISO, toISOValue,
        // registros
        whichEdge, edgeCount
    ]);

    const { points, yMin, yMax, labels } = useMemo(() => {
        const values = regsFiltered.map((r) => r.valorNum);
        const target = typeof goal.valorObjetivo === "number" ? goal.valorObjetivo : null;
        let yMin = Math.min(...values, ...(target != null ? [target] : []));
        let yMax = Math.max(...values, ...(target != null ? [target] : []));
        if (!isFinite(yMin) || !isFinite(yMax)) { yMin = 0; yMax = 1; }
        if (yMin === yMax) { yMin = yMin - 1; yMax = yMax + 1; }

        const labels = regsFiltered.map((r) => r.fecha.slice(5));
        const points = regsFiltered.map((r, idx) => ({ label: labels[idx], value: r.valorNum }));
        return { points, yMin, yMax, labels };
    }, [regsFiltered, goal]);

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

    const tooltipFor = (p) => {
        const txt = `${p.label}  •  ${roundNicely(p.value)} ${goal.unidad || ""}`.trim();
        const width = 10 + txt.length * 7.2;
        return { txt, width, height: 22 };
    };

    const changeCount = (v) => {
        if (v === "") return setEdgeCount("");
        const n = Math.max(1, Math.floor(Number(v) || 0));
        setEdgeCount(String(n));
    };

    // si cambia mes/año y estamos en semana, mantener en rango
    React.useEffect(() => {
        if (periodMode === "semana" && selWeek > weeksInSelMonth) setSelWeek(weeksInSelMonth);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selMonth, selYear, periodMode, weeksInSelMonth]);

    return (
        <div className="insight-block">
            <div className="insight-title bump-up">
                Evolución de registros <span className="muted">({goal.unidad || ""})</span>
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

            {/* ─── Barra de filtros: IZQ selector / DCHA controles ─── */}
            <div className="filterbar">
                <div className="filter-chooser">
                    <div className="filter-chooser-title">Filtrar por:</div>
                    <label className="radio-line">
                        <input
                            type="radio"
                            name="insightFilter"
                            checked={activeFilter === "rango"}
                            onChange={() => setActiveFilter("rango")}
                        />
                        <span>Rango manual</span>
                    </label>
                    <label className="radio-line">
                        <input
                            type="radio"
                            name="insightFilter"
                            checked={activeFilter === "periodo"}
                            onChange={() => setActiveFilter("periodo")}
                        />
                        <span>Periodo</span>
                    </label>
                    <label className="radio-line">
                        <input
                            type="radio"
                            name="insightFilter"
                            checked={activeFilter === "registros"}
                            onChange={() => setActiveFilter("registros")}
                        />
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
                                max={maxISO}
                                onChange={(e) => setFromISO(e.target.value)}
                                title="Fecha inicio (incluida)"
                            />
                            <span className="filter-sep">—</span>
                            <input
                                className="filter-input"
                                type="date"
                                value={toISOValue}
                                min={minISO}
                                max={maxISO}
                                onChange={(e) => setToISOValue(e.target.value)}
                                title="Fecha fin (incluida)"
                            />
                            {(fromISO !== minISO || toISOValue !== maxISO) && (
                                <button className="filter-clear" onClick={() => { setFromISO(minISO); setToISOValue(maxISO); }}>
                                    Limpiar
                                </button>
                            )}
                            <div className="filter-hint">Inicio ≥ {minISO} y fin ≤ {maxISO}.</div>
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
                                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                </select>
                            )}

                            {periodMode === "semana" && (
                                <select
                                    className="filter-select short"
                                    value={selWeek}
                                    onChange={(e) => setSelWeek(Number(e.target.value))}
                                    title="Semana del mes"
                                >
                                    {Array.from({ length: weeksInSelMonth }).map((_, i) => (
                                        <option key={i} value={i + 1}>Sem {i + 1}</option>
                                    ))}
                                </select>
                            )}

                            <div className="filter-hint">Dentro de {minISO} a {maxISO}.</div>
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

/* ---------------------- Calendario Bool (sin cambios de lógica) ---------------------- */

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

    const today = new Date();
    const minYM = { y: startDate.getFullYear(), m: startDate.getMonth() };
    const maxYM = { y: today.getFullYear(), m: today.getMonth() };

    const initial = clampYM(maxYM, minYM, maxYM);
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
        </div>
    );
}
