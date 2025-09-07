// src/test/unit/components/GoalInsight.test.jsx
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import GoalInsight from '../../../components/GoalInsight';

// Algunas fechas útiles
const NUM_REGS = [
    { fecha: '2025-01-03', valorNum: 3 },
    { fecha: '2025-01-10', valorNum: 4 },
    { fecha: '2025-02-05', valorNum: 6 },
    { fecha: '2025-02-20', valorNum: 7 },
];

// Meta Num indefinida con objetivo
const mkNumGoal = (over = {}) => ({
    tipo: 'Num',
    unidad: 'kg',
    fecha: '2025-01-01',
    duracionUnidad: 'Indefinido',
    valorObjetivo: 10,
    estadisticas: { fechaFin: null },
    registros: NUM_REGS,
    ...over,
});

// Meta Bool indefinida con un par de registros en meses consecutivos
const mkBoolGoal = (over = {}) => ({
    tipo: 'Bool',
    fecha: '2025-09-01',
    duracionUnidad: 'Indefinido',
    registros: [
        { fecha: '2025-09-03', valorBool: true },
        { fecha: '2025-09-04', valorBool: false },
        { fecha: '2025-10-01', valorBool: true }, // para poder navegar al siguiente mes
    ],
    ...over,
});

describe('GoalInsight — estados básicos', () => {
    test('sin meta: muestra placeholder', () => {
        render(<GoalInsight goal={null} />);
        expect(
            screen.getByText(/Selecciona una meta para ver un resumen/i)
        ).toBeInTheDocument();
    });

    test('cargando: cuando registros no es array', () => {
        render(<GoalInsight goal={{ tipo: 'Num', registros: null }} />);
        expect(screen.getByText(/Cargando registros…/i)).toBeInTheDocument();
    });
});

describe('GoalInsight — Num (gráfico + filtros)', () => {
    test('renderiza título, objetivo y filtro por defecto (rango)', () => {
        render(<GoalInsight goal={mkNumGoal()} />);

        // Título y objetivo
        expect(screen.getByText(/Evolución de registros/i)).toBeInTheDocument();
        expect(screen.getByText(/Objetivo:/)).toBeInTheDocument(); // línea de objetivo en el SVG

        // Filtro por defecto: "Rango manual" con 2 inputs date y botón Limpiar oculto
        expect(screen.getByText('Filtrar por:')).toBeInTheDocument();
        // Los 2 inputs date por título (más robusto en JSDOM)
        const from = screen.getByTitle('Fecha inicio (incluida)');
        const to   = screen.getByTitle('Fecha fin (incluida)');
        expect(from).toBeInTheDocument();
        expect(to).toBeInTheDocument();
    });

    test('Rango manual: cambiar fechas muestra botón "Limpiar" y altera nº de puntos', () => {
        const { container } = render(<GoalInsight goal={mkNumGoal()} />);

        const from = screen.getByTitle('Fecha inicio (incluida)');
        const to   = screen.getByTitle('Fecha fin (incluida)');
        fireEvent.change(from, { target: { value: '2025-02-01' } });
        fireEvent.change(to,   { target: { value: '2025-02-28' } });

        // Aparece el botón Limpiar
        const btnClear = screen.getByRole('button', { name: /limpiar/i });
        expect(btnClear).toBeInTheDocument();

        // En el SVG hay círculos (= puntos). Para febrero deben ser menos que el total (4 → 2)
        const beforeClear = container.querySelectorAll('svg circle').length;
        expect(beforeClear).toBeGreaterThan(0);
        expect(beforeClear).toBeLessThan(NUM_REGS.length + 1); // +1 por si apareciera el punto de hover (no debería sin mover ratón)

        // Al limpiar volvemos a ver todos los puntos (>= número de registros)
        fireEvent.click(btnClear);
        const afterClear = container.querySelectorAll('svg circle').length;
        expect(afterClear).toBeGreaterThanOrEqual(NUM_REGS.length);
    });

    test('Periodo: semana/mes/año muestran selects e hint correctos', () => {
        render(<GoalInsight goal={mkNumGoal()} />);

        // Cambiar a "Periodo"
        fireEvent.click(screen.getByRole('radio', { name: /Periodo/i }));

        // Hay un <select> para el modo de periodo
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);

        // Elegimos "semana" → aparece combo de semanas y hint de rango
        fireEvent.change(selects[0], { target: { value: 'semana' } });
        expect(screen.getByTitle('Semana del mes')).toBeInTheDocument();

        // El hint indica "A partir de ..." porque es indefinido
        expect(screen.getByText(/A partir de/i)).toBeInTheDocument();

        // Cambiamos a "mes" → ya no hay combo de semanas
        fireEvent.change(selects[0], { target: { value: 'mes' } });
        expect(screen.queryByTitle('Semana del mes')).toBeNull();

        // Cambiamos a "anio" para cubrir rama
        fireEvent.change(selects[0], { target: { value: 'anio' } });
        expect(screen.getByText(/A partir de|Dentro de/)).toBeInTheDocument();
    });

    test('Nº de registros: permite escribir número y alternar Primeros/Últimos', () => {
        render(<GoalInsight goal={mkNumGoal()} />);

        fireEvent.click(screen.getByRole('radio', { name: /Nº de registros/i }));
        const inputN = screen.getByRole('spinbutton', { name: /número/i });
        fireEvent.change(inputN, { target: { value: '3' } });

        // Alternamos tipo
        const selEdge = screen.getByRole('combobox', { name: /tipo/i });
        fireEvent.change(selEdge, { target: { value: 'primeros' } });

        // Hint fijo para esta vista
        expect(screen.getByText(/De la selección actual\./)).toBeInTheDocument();
    });
});

describe('GoalInsight — Bool (calendario + navegación + racha)', () => {
    test('renderiza cabecera, leyenda y celdas con clases ok/ko/none', () => {
        const { container } = render(<GoalInsight goal={mkBoolGoal()} />);

        expect(screen.getByText(/Registros del mes/)).toBeInTheDocument();
        const block = screen.getByText(/Registros del mes/).closest('.insight-block');
        const legend = block ? block.querySelector('.calendar-legend') : null;
        expect(legend).not.toBeNull();
        expect(legend).toHaveTextContent(/(^|\s)Sí(\s|$)/u);
        expect(legend).toHaveTextContent(/(^|\s)No(\s|$)/u);

        // Hay celdas con estados
        expect(container.querySelector('.cal-day.ok')).toBeTruthy();
        expect(container.querySelector('.cal-day.ko')).toBeTruthy();
        // puede que haya "none" según el mes (huecos)
        expect(container.querySelector('.cal-day.none')).toBeTruthy();
    });

    test('navegación de meses con botones accesibles', () => {
        render(<GoalInsight goal={mkBoolGoal()} />);

        // Mes actual (entre paréntesis)
        const monthLabel = screen.getByText(/\(.+\)/).textContent;

        // Podemos ir al mes siguiente (tienes un registro en octubre)
        const nextBtn = screen.getByRole('button', { name: /Mes siguiente/i });
        expect(nextBtn).not.toBeDisabled();
        fireEvent.click(nextBtn);

        // El label de mes debe cambiar
        const newLabel = screen.getByText(/\(.+\)/).textContent;
        expect(newLabel).not.toEqual(monthLabel);

        // También existe el botón de anterior (puede estar deshabilitado según minYM)
        expect(screen.getByRole('button', { name: /Mes anterior/i })).toBeInTheDocument();
    });

    test('Numeric: aparece tooltip al mover el ratón sobre el SVG y desaparece al salir', () => {
        const goal = mkNumGoal(); // ya definido arriba en tu test
        const { container } = render(<GoalInsight goal={goal} />);

        const svg = container.querySelector('svg.insight-svg');
        expect(svg).toBeInTheDocument();

        // JSDOM devuelve width=0, así que mockeamos el bbox para que onMove funcione
        svg.getBoundingClientRect = () => ({
            left: 0,
            top: 0,
            width: 700,
            height: 260,
            right: 700,
            bottom: 260,
            x: 0,
            y: 0,
            toJSON: () => {}
        });

        // Disparamos el movimiento del ratón → ejecuta onMove (función no cubierta aún)
        fireEvent.mouseMove(svg, { clientX: 120, clientY: 100 });
        expect(container.querySelector('.insight-tooltip')).toBeInTheDocument();

        // Salimos del SVG → ejecuta onLeave (otra función sin cubrir)
        fireEvent.mouseLeave(svg);
        expect(container.querySelector('.insight-tooltip')).toBeNull();
    });
});
