// src/test/unit/pages/Login.test.jsx
import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/firestore', () => ({ getFirestore: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    GoogleAuthProvider: vi.fn(function GoogleAuthProvider() {}),
    signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'u1' } })),
    signInWithEmailAndPassword: vi.fn((_auth, email) => {
        if (email === 'bad@x.com') {
            const err = new Error('cred'); err.code = 'auth/invalid-credential'; return Promise.reject(err);
        }
        return Promise.resolve({ user: { uid: 'ok' } });
    }),
    createUserWithEmailAndPassword: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
}));
const loginSpy = vi.fn();
vi.mock('../../../auth-context.jsx', () => ({
    useAuth: () => ({ user: null, profile: null, login: loginSpy, loginEmail: vi.fn(), registerEmail: vi.fn(), logout: vi.fn(), deleteAccount: vi.fn() }),
    AuthProvider: ({ children }) => <>{children}</>,
}));
vi.mock('react-router-dom', async (orig) => {
    const m = await orig();
    return { ...m, useNavigate: () => vi.fn() };
});
vi.mock('../../../services/api.js', () => ({ getProfile: vi.fn(() => Promise.resolve({ data: { id: 1 } })) }));

import Login from '../../../pages/Login.jsx';

describe('Login', () => {
    test('credenciales inválidas → muestra error', async () => {
        render(<Login />);

        const submitBtn = screen.getByRole('button', { name: /^login$/i });
        const form = submitBtn.closest('form');
        if (!form) throw new Error('No se encontró el formulario de login');

        const emailInput = form.querySelector('input[type="email"]');
        const pwdInput   = form.querySelector('input[type="password"]');
        if (!emailInput || !pwdInput) {
            screen.debug(); // ayuda si cambia el markup
            throw new Error('No se encontraron inputs de email/password');
        }

        fireEvent.change(emailInput, { target: { value: 'bad@x.com' } });
        fireEvent.change(pwdInput,   { target: { value: '123456' } });
        fireEvent.click(submitBtn);

        expect(await screen.findByText(/no se pudo iniciar sesión/i)).toBeInTheDocument();
    });

    test('credenciales válidas → no muestra error', async () => {
        render(<Login />);

        const submitBtn = screen.getByRole('button', { name: /^login$/i });
        const form = submitBtn.closest('form');
        if (!form) throw new Error('No se encontró el formulario de login');

        const emailInput = form.querySelector('input[type="email"]');
        const pwdInput   = form.querySelector('input[type="password"]');
        if (!emailInput || !pwdInput) {
            screen.debug();
            throw new Error('No se encontraron inputs de email/password');
        }

        fireEvent.change(emailInput, { target: { value: 'ok@x.com' } });
        fireEvent.change(pwdInput,   { target: { value: '123456' } });
        fireEvent.click(submitBtn);

        // Espero a que se asiente el estado y verifica que NO aparece el error
        await waitFor(() => {
            expect(screen.queryByText(/no se pudo iniciar sesión/i)).toBeNull();
        });
    });

    test('login con Google dispara useAuth().login', async () => {
        loginSpy.mockClear();
        render(<Login />);
        const googleBtn = await screen.findByRole('button', { name: /google/i });
        fireEvent.click(googleBtn);
        await waitFor(() => expect(loginSpy).toHaveBeenCalled());
    });
});
