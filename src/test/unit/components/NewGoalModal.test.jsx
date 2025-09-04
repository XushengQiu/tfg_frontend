// src/test/unit/components/NewGoalModal.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

// mock de driver.js para evitar efectos
vi.mock('driver.js', () => ({ driver: () => ({ drive: vi.fn(), destroy: vi.fn() }) }));

import NewGoalModal from '../../../components/NewGoalModal.jsx';

function fillNombre() {
    // si tu label tiene asterisco, este regex lo captura igual
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Correr' }});
}

describe('NewGoalModal', () => {
    test('con objetivo Check y periodo indefinido permite crear', () => {
        const onCreate = vi.fn();
        render(<NewGoalModal open onCreate={onCreate} onClose={() => {}} />);

        fillNombre();

        // evita ambigüedad: selecciona el CHECKBOX cuyo nombre es "Indefinido"
        fireEvent.click(screen.getByRole('checkbox', { name: /indefinido/i }));

        // "Check" es un CHECKBOX en el componente
        const checkToggle = screen.getByRole('checkbox', { name: /check/i });
        fireEvent.click(checkToggle);

        fireEvent.click(screen.getByRole('button', { name: /crear/i }));
        expect(onCreate).toHaveBeenCalled();
    });

    test('con objetivo numérico inválido NO crea', () => {
        const onCreate = vi.fn();
        render(<NewGoalModal open onCreate={onCreate} onClose={() => {}} />);

        fillNombre();

        // objetivo numérico: suele ser el primer spinbutton
        const objetivoNum = screen.getAllByRole('spinbutton')[0];
        fireEvent.change(objetivoNum, { target: { value: 'abc' } });

        // "Unidad" no tiene label, usa placeholder
        const unidad = screen.getByPlaceholderText(/unidad/i);
        fireEvent.change(unidad, { target: { value: 'km' } });

        fireEvent.click(screen.getByRole('button', { name: /crear/i }));
        expect(onCreate).not.toHaveBeenCalled();
    });
});
