import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

// Stub de Modal para simplificar el DOM del diálogo
vi.mock('../../../components/Modal.jsx', () => ({
    default: ({ open, title, children, onClose }) =>
        open ? (
            <div role="dialog" aria-label={title}>
                <button aria-label="Cerrar" onClick={onClose}>×</button>
                {children}
            </div>
        ) : null
}));

import Onboarding from '../../../pages/Onboarding.jsx';

describe('Onboarding – informativos legales', () => {
    test('abre/cierra Términos y Tratamiento de datos (botones flotantes)', () => {
        render(
            <MemoryRouter>
                <Onboarding />
            </MemoryRouter>
        );

        // Términos
        fireEvent.click(screen.getByRole('button', { name: /términos y condiciones/i }));
        expect(screen.getByRole('dialog', { name: /términos/i })).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText(/cerrar/i));
        expect(screen.queryByRole('dialog', { name: /términos/i })).toBeNull();

        // Tratamiento de datos
        fireEvent.click(screen.getByRole('button', { name: /tratamiento de datos/i }));
        const dlg2 = screen.getByRole('dialog', { name: /tratamiento de datos/i });
        expect(dlg2).toBeInTheDocument();
        fireEvent.click(within(dlg2).getByLabelText(/cerrar/i));
        expect(screen.queryByRole('dialog', { name: /tratamiento de datos/i })).toBeNull();
    });
});
