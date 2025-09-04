import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import EditGoalModal from '../../../components/EditGoalModal';

const baseGoal = {
    tipo: 'Num', nombre: 'Agua', descripcion: '',
    duracionUnidad: 'días', duracionValor: 7, valorObjetivo: 2, unidad: 'L',
};

test('guardar dispara onSave con el formulario', async () => {
    const onSave = vi.fn();
    render(<EditGoalModal open goal={baseGoal} onClose={() => {}} onSave={onSave} />);
    await userEvent.clear(screen.getByLabelText(/nombre/i));
    await userEvent.type(screen.getByLabelText(/nombre/i), 'Agua diaria');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Agua diaria' }));
});

test('toggle indefinido permite guardar', async () => {
    const onSave = vi.fn();
    render(<EditGoalModal open goal={baseGoal} onClose={() => {}} onSave={onSave} />);
    const indef = screen.getAllByRole('checkbox', { name: /indefinido/i })[0];
    await userEvent.click(indef);
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).toHaveBeenCalled();
});
