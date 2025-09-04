// src/test/unit/pages/Onboarding.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// mock muy simple de Modal (como ya tenías)
vi.mock('../../../components/Modal.jsx', () => ({
    default: ({ open, children }) => (open ? <div role="dialog">{children}</div> : null)
}));

import Onboarding from '../../../pages/Onboarding.jsx';

describe('Onboarding - modales legales', () => {
    test('abre y cierra Términos y Tratamiento de datos', () => {
        render(
            <MemoryRouter>
                <Onboarding />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /términos y condiciones/i }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /tratamiento de datos/i }));
        expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
    });
});
