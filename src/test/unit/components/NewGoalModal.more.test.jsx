// src/test/unit/components/NewGoalModal.more.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import NewGoalModal from '../../../components/NewGoalModal.jsx';

function fillBasicName() {
    // El label "Nombre*:" envuelve el input → accesible por label
    const name = screen.getByLabelText(/nombre/i);
    fireEvent.change(name, { target: { value: 'Correr' } });
}

describe('NewGoalModal – casos extra', () => {
    test('crea objetivo NUM con período definido', () => {
        const onCreate = vi.fn();
        render(<NewGoalModal open onCreate={onCreate} onClose={()=>{}} />);

        fillBasicName();

        // Periodo definido
        const periodBox = document.querySelector('#newgoal-period');
        const periodNum = periodBox.querySelector('input[type="number"]');
        const periodUnit = periodBox.querySelector('select');
        fireEvent.change(periodNum,  { target: { value: '3' } });
        fireEvent.change(periodUnit, { target: { value: 'meses' } });

        // Objetivo numérico (no activar "Check")
        const objBox = document.querySelector('#newgoal-obj');
        const objNum = objBox.querySelector('input[type="number"]');
        const objUnit = objBox.querySelector('input[placeholder="unidad"]');
        fireEvent.change(objNum,  { target: { value: '42' } });
        fireEvent.change(objUnit, { target: { value: 'km' } });

        fireEvent.click(screen.getByRole('button', { name: /crear/i }));

        // Comprobamos los campos-clave y luego el tipo
        expect(onCreate).toHaveBeenCalled();
        const payload = onCreate.mock.calls[0][0];
        expect(payload).toEqual(expect.objectContaining({
                nombre: 'Correr',
                periodoIndef: false,
                periodoNum: '3',
                periodoUnit: 'meses',
                objetivoNum: '42',
                objetivoUnidad: 'km',
        }));
        // En tu implementación actual el tipo identifica el modo numérico:
        expect(payload.tipo).toBe('num');
    });

    test('cancelar cierra el modal (llama onClose)', () => {
        const onClose = vi.fn();
        render(<NewGoalModal open onCreate={()=>{}} onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
        expect(onClose).toHaveBeenCalled();
    });
});
