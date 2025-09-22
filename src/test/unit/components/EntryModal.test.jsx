// src/test/unit/components/EntryModal.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import EntryModal from "../../../components/EntryModal.jsx";

const baseGoal = {
    nombre: 'Leer',
    duracionUnidad: 'Indefinido',
    duracionValor: null,
    tipo: 'Bool', // o 'Num'
    valorObjetivo: 10,
    unidad: 'páginas',
    fecha: '2024-01-10',
};

describe('EntryModal', () => {
    test('Bool: radio Sí/No y submit manda valorBool', () => {
        const onSave = vi.fn();
        render(<EntryModal open goal={{...baseGoal, tipo:'Bool'}} onClose={()=>{}} onSave={onSave} />);

        fireEvent.click(screen.getByLabelText(/^sí$/i));
        fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ valorBool: true }));
    });

    test('Num: respeta minDate = fecha creación', () => {
        const onSave = vi.fn();
        render(<EntryModal open goal={{...baseGoal, tipo:'Num'}} onClose={()=>{}} onSave={onSave} />);

        const fecha = screen.getByLabelText(/fecha/i);
        expect(fecha).toHaveAttribute('min', '2024-01-10');
        fireEvent.change(fecha, { target: { value: '2024-01-10' }});

        // valor numérico válido
        const inputNum = screen.getByRole('spinbutton');
        fireEvent.change(inputNum, { target: { value: '2.50' }});
        fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ valorNum: '2.50' }));
    });
});
