import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

// Mock router (solo necesitamos navigate)
vi.mock('react-router-dom', async (orig) => {
    const m = await orig();
    return { ...m, useNavigate: () => vi.fn() };
});

// Mock API
const createUser = vi.fn();
vi.mock('../../../services/api.js', () => ({ createUser: (...args) => createUser(...args) }));

// Mock Modal para NO requerir scroll y tener botones Aceptar/Denegar activos
vi.mock('../../../components/Modal.jsx', () => ({
    default: ({ open, title, onAccept, onClose, acceptText = 'Aceptar', denyText = 'Denegar', children }) =>
        open ? (
            <div role="dialog" aria-label={title}>
                <div>{children}</div>
                <button onClick={onClose}>{denyText}</button>
                <button onClick={onAccept}>{acceptText}</button>
            </div>
        ) : null
}));

import Onboarding from '../../../pages/Onboarding.jsx';

describe('Onboarding – flujo de creación', () => {
    test('submit → Términos → Datos → crea usuario (happy path)', async () => {
        render(<Onboarding />);

        // Rellena nombre mínimo válido
        const nombre = screen.getByLabelText(/nombre/i);
        fireEvent.change(nombre, { target: { value: '  Ana  ' } });

        // Enviar formulario (debe abrir Términos)
        fireEvent.click(screen.getByRole('button', { name: /crear/i }));
        const dialogTerms = screen.getByRole('dialog', { name: /términos y condiciones/i });

        // Acepta Términos → abre Datos
        fireEvent.click(within(dialogTerms).getByRole('button', { name: /aceptar/i }));
        const dialogData = screen.getByRole('dialog', { name: /tratamiento de datos/i });

        // Acepta Datos → llama a createUser y navega
        createUser.mockResolvedValueOnce({ data: { ok: true } });
        fireEvent.click(within(dialogData).getByRole('button', { name: /aceptar/i }));

        await waitFor(() => expect(createUser).toHaveBeenCalledTimes(1));
        expect(createUser).toHaveBeenCalledWith({ nombre: 'Ana', apellidos: null });
        // Navegación: ya la proporciona el mock de useNavigate (no necesitamos assert aquí).
    });

    test('deny en Términos o Datos cierra el modal', () => {
        render(<Onboarding />);

        fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Ana' } });
        fireEvent.click(screen.getByRole('button', { name: /crear/i }));

        const dialogTerms = screen.getByRole('dialog', { name: /términos y condiciones/i });
        // Deniega términos → se cierra
        fireEvent.click(within(dialogTerms).getByRole('button', { name: /denegar/i }));
        expect(screen.queryByRole('dialog', { name: /términos y condiciones/i })).toBeNull();

        // Vuelve a abrir flujo y ahora deniega datos
        fireEvent.click(screen.getByRole('button', { name: /crear/i }));
        fireEvent.click(within(screen.getByRole('dialog', { name: /términos/i })).getByRole('button', { name: /aceptar/i }));
        const dialogData = screen.getByRole('dialog', { name: /tratamiento de datos/i });
        fireEvent.click(within(dialogData).getByRole('button', { name: /denegar/i }));
        expect(screen.queryByRole('dialog', { name: /tratamiento de datos/i })).toBeNull();
    });

    test('error al crear usuario → muestra alert con mensaje de backend', async () => {
        // espiamos alert para no romper el test runner
        const spyAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<Onboarding />);

        fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Ana' } });
        fireEvent.click(screen.getByRole('button', { name: /crear/i }));
        fireEvent.click(within(screen.getByRole('dialog', { name: /términos/i })).getByRole('button', { name: /aceptar/i }));

        // simula error con { response: { status, data } } para cubrir rama de apiError
        createUser.mockRejectedValueOnce({ response: { status: 400, data: 'Nombre inválido' } });

        const dialogData = screen.getByRole('dialog', { name: /tratamiento de datos/i });
        fireEvent.click(within(dialogData).getByRole('button', { name: /aceptar/i }));

        await waitFor(() => {
            expect(spyAlert).toHaveBeenCalled();
            expect(spyAlert.mock.calls[0][0]).toMatch(/error 400/i);
            expect(spyAlert.mock.calls[0][0]).toMatch(/nombre inválido/i);
        });

        spyAlert.mockRestore();
    });
});
