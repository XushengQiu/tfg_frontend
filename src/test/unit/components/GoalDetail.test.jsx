// src/test/unit/components/GoalDetail.test.jsx
import { render, screen, within, fireEvent } from '@testing-library/react';
import React from 'react';
import GoalDetail from '../../../components/GoalDetail';

// Util para construir metas
const mkGoal = (over = {}) => ({
    _id: 'g1',
    nombre: 'Meta X',
    descripcion: 'Desc',
    tipo: 'Num',
    unidad: 'kg',
    finalizado: false,
    registros: [],
    ...over,
});

describe('GoalDetail', () => {
    test('sin meta: placeholders visibles', () => {
        render(<GoalDetail goal={null} />);
        expect(
            screen.getByText(/Seleccione una meta para ver sus registros/i)
        ).toBeInTheDocument();
        expect(screen.getByText('Meta')).toBeInTheDocument();
        expect(screen.getByText('Descripción')).toBeInTheDocument();
    });

    test('Num: muestra registros ordenados desc y columna de unidad', () => {
        const goal = mkGoal({
            registros: [
                { fecha: '2025-01-01', valorNum: 10 },
                { fecha: '2025-01-02', valorNum: 15 },
            ],
        });
        render(<GoalDetail goal={goal} />);

        expect(screen.getByText(/Valor \(kg\)/)).toBeInTheDocument();

        const rows = screen.getAllByRole('row').slice(1);
        expect(within(rows[0]).getByText(/02\/01\/2025/)).toBeInTheDocument();
        expect(within(rows[0]).getByText('15')).toBeInTheDocument();
        expect(within(rows[1]).getByText(/01\/01\/2025/)).toBeInTheDocument();
        expect(within(rows[1]).getByText('10')).toBeInTheDocument();
    });

    test('Bool: muestra iconos Sí/No mediante alt y permite borrar si no está finalizado', () => {
        const onDeleteRecord = vi.fn();
        const goal = mkGoal({
            tipo: 'Bool',
            finalizado: false,
            registros: [
                { fecha: '2025-01-03', valorBool: true },
                { fecha: '2025-01-02', valorBool: false },
            ],
        });
        render(<GoalDetail goal={goal} onDeleteRecord={onDeleteRecord} />);

        expect(screen.getByAltText('Sí')).toBeInTheDocument();
        expect(screen.getByAltText('No')).toBeInTheDocument();

        const btns = screen.getAllByRole('button', { name: /eliminar/i });
        fireEvent.click(btns[0]);
        expect(onDeleteRecord).toHaveBeenCalledWith('g1', expect.any(String));
    });

    test('finalizado: NO muestra botón Eliminar', () => {
        const goal = mkGoal({
            finalizado: true,
            registros: [{ fecha: '2025-01-01', valorNum: 1 }],
        });
        render(<GoalDetail goal={goal} />);
        expect(screen.queryByRole('button', { name: /eliminar/i })).toBeNull();
    });

    test('sin registros: muestra placeholder "Sin registros."', () => {
        const goal = mkGoal({ registros: [] });
        render(<GoalDetail goal={goal} />);
        expect(screen.getByText(/Sin registros\./)).toBeInTheDocument();
    });
});
