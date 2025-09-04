import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

// Mocks mínimos necesarios para abrir modales y reset
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/firestore', () => ({ getFirestore: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    GoogleAuthProvider: vi.fn(function GoogleAuthProvider() {}),
    sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
    signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: 'x' } })),
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
}));
vi.mock('../../../auth-context.jsx', () => ({
    useAuth: () => ({ user: null, profile: null, login: vi.fn(), logout: vi.fn() }),
    AuthProvider: ({ children }) => <>{children}</>,
}));
vi.mock('../../../services/api.js', () => ({ getProfile: vi.fn(() => Promise.resolve({ data: { id: 1 } })) }));
vi.mock('react-router-dom', async (orig) => {
    const m = await orig(); return { ...m, useNavigate: () => vi.fn() };
});

import Login from '../../../pages/Login.jsx';

describe('Login (UI extra)', () => {
    test('toggle mostrar/ocultar contraseña y popover de requisitos', () => {
        render(<Login />);

        // Mostrar contraseña
        const eyeBtn = screen.getByRole('button', { name: /mostrar contraseña/i });
        fireEvent.click(eyeBtn);
        // Ahora cambia a "Ocultar contraseña"
        expect(screen.getByRole('button', { name: /ocultar contraseña/i })).toBeInTheDocument();

        // Popover "Requisitos de contraseña"
        const infoBtn = screen.getByRole('button', { name: /requisitos de contraseña/i });
        fireEvent.click(infoBtn);
        expect(screen.getByRole('status')).toBeInTheDocument(); // aparece el popover
    });

    test('reset password: abre modal, envía enlace y muestra confirmación', async () => {
        render(<Login />);

        // Abre el modal
        fireEvent.click(screen.getByRole('button', { name: /¿has olvidado tu contraseña\?/i }));
        const dialog = screen.getByRole('dialog', { name: /restablecer contraseña/i });
        const { getByLabelText, getByRole, findByText } = within(dialog);

        const email = getByLabelText(/correo/i);
        fireEvent.change(email, { target: { value: 'reset@x.com' } });
        fireEvent.click(getByRole('button', { name: /enviar enlace/i }));

        expect(await findByText(/te hemos enviado un correo/i)).toBeInTheDocument();
    });

    test('botones legales: “Términos y condiciones” y “Tratamiento de datos” abren modal', () => {
        render(<Login />);

        fireEvent.click(screen.getByRole('button', { name: /términos y condiciones/i }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Abrimos el otro también
        fireEvent.click(screen.getByRole('button', { name: /tratamiento de datos/i }));
        expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
    });
});
