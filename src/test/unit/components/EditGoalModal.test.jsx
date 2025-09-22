import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import EditGoalModal from '../../../components/EditGoalModal.jsx';

const goalNum = {
    tipo: 'Num',
    nombre: 'Correr',
    descripcion: 'desc',
    duracionUnidad: 'semanas',
    duracionValor: 4,
    valorObjetivo: 10,
    unidad: 'km',
};

describe('EditGoalModal', () => {
    test('prefill y submit llama onSave', () => {
        const onSave = vi.fn();
        render(<EditGoalModal open goal={goalNum} onClose={() => {}} onSave={onSave} />);

        const nombre = screen.getByLabelText(/nombre/i);
        fireEvent.change(nombre, { target: { value: 'Correr+' } });

        const objetivoNum = screen.getByDisplayValue(String(goalNum.valorObjetivo));
        fireEvent.change(objetivoNum, { target: { value: '12.5' } });

        fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            nombre: 'Correr+',
            objetivoNum: '12.5',
        }));
    });

    test('marcar “Indefinido” deshabilita inputs de duración', () => {
        render(<EditGoalModal open goal={goalNum} onClose={() => {}} onSave={() => {}} />);

        const dur = screen.getByText(/^duración:/i);
        const durBlock = dur.closest('label');
        if (!durBlock) throw new Error('No se encontró el bloque de Duración');

        const indefCheckbox = durBlock.querySelector('input[type="checkbox"]');
        if (!indefCheckbox) throw new Error('No se encontró el checkbox Indefinido');
        fireEvent.click(indefCheckbox);

        const num   = durBlock.querySelector('input[type="number"]');
        const unit  = durBlock.querySelector('select');
        expect(num).toHaveProperty('disabled', true);
        expect(unit).toHaveProperty('disabled', true);
    });
});
