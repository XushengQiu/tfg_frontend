import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import GoalRow from '../../../components/GoalRow.jsx';

const base = {
    _id: 'g1',
    nombre: 'Leer',
    fecha: '2025-01-01',
    periodo: { indefinido: true },
    objetivo: { isBool: true },
    finalizado: false,
};

function renderRow(extra = {}) {
    const onSelect   = vi.fn();
    const onEntry    = vi.fn();
    const onEdit     = vi.fn();
    const onFinalize = vi.fn();
    const onDelete   = vi.fn();

    render(
        <table><tbody>
        <GoalRow
            goal={{ ...base, ...extra }}
            createdLabel={() => 'hoy'}
            objectiveLabel={() => 'Check'}
            selected={false}
            onSelect={onSelect}
            onEntry={onEntry}
            onEdit={onEdit}
            onFinalize={onFinalize}
            onDelete={onDelete}
        />
        </tbody></table>
    );

    return { onSelect, onEntry, onEdit, onFinalize, onDelete };
}

describe('GoalRow (acciones)', () => {
    test('click en la fila selecciona; los botones llaman a sus handlers y NO seleccionan', () => {
        const spies = renderRow();

        // click fila => selecciona
        fireEvent.click(screen.getByRole('row'));
        expect(spies.onSelect).toHaveBeenCalledTimes(1);

        // Entrada
        fireEvent.click(screen.getByRole('button', { name: /registro/i }));
        expect(spies.onEntry).toHaveBeenCalledTimes(1);
        expect(spies.onSelect).toHaveBeenCalledTimes(1);

        // Editar
        fireEvent.click(screen.getByRole('button', { name: /editar/i }));
        expect(spies.onEdit).toHaveBeenCalledTimes(1);
        expect(spies.onSelect).toHaveBeenCalledTimes(1);

        // Finalizar
        fireEvent.click(screen.getByRole('button', { name: /finalizar/i }));
        expect(spies.onFinalize).toHaveBeenCalledTimes(1);
        expect(spies.onSelect).toHaveBeenCalledTimes(1);

        // Eliminar
        fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
        expect(spies.onDelete).toHaveBeenCalledTimes(1);
        expect(spies.onSelect).toHaveBeenCalledTimes(1);
    });
});
