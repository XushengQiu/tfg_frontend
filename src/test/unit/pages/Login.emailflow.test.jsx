// src/test/unit/pages/Login.emailflow.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// 1) Mock router (hoisted)
const nav = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router-dom', async (orig) => {
    const m = await orig();
    return { ...m, useNavigate: () => nav.navigate };
});

// 2) Mock firebase/auth (hoisted)
const auth = vi.hoisted(() => ({
    getAuth: vi.fn(() => ({})),
    signInWithEmailAndPassword: vi.fn(),
    GoogleAuthProvider: vi.fn(function GoogleAuthProvider(){}),
    signInWithPopup: vi.fn(),
}));
vi.mock('firebase/auth', () => auth);

// 3) Mock API (hoisted)
const api = vi.hoisted(() => ({
    getProfile: vi.fn(),
}));
vi.mock('../../../services/api.js', () => api);

// 4) Mock auth-context (hoisted)
const ctx = vi.hoisted(() => ({
    useAuth: () => ({ user: null, profile: null, login: vi.fn(), logout: vi.fn() }),
}));
vi.mock('../../../auth-context.jsx', () => ctx);

// 5) IMPORTS después de mocks
import Login from '../../../pages/Login.jsx';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getProfile } from '../../../services/api.js';

// ------- helpers reutilizables -------
// En lugar de buscar el botón por texto (hay 2 que encajan),
// localizamos el <form> a partir del input de email.
function getScopedFormForLogin() {
    const emailInput =
        screen.queryByLabelText(/correo/i, { selector: 'input' }) ||
        screen.queryByPlaceholderText(/correo|email/i) ||
        document.querySelector('input[type="email"]');

    const form = emailInput?.closest('form') || document.querySelector('form');
    if (!form) throw new Error('No se encontró el formulario de login');
    return form;
}

function getEmailInput(form) {
    const s = within(form);
    return (
        s.queryByLabelText(/correo/i, { selector: 'input' }) ||
        s.queryByPlaceholderText(/correo|email/i) ||
        form.querySelector('input[type="email"]')
    );
}

function getPasswordInput(form) {
    const s = within(form);
    return (
        s.queryByLabelText(/contraseña/i, { selector: 'input' }) ||
        s.queryByPlaceholderText(/contraseña|password/i) ||
        form.querySelector('input[type="password"]')
    );
}

function fillAndSubmit() {
    const form = getScopedFormForLogin();
    const email = getEmailInput(form);
    const pwd   = getPasswordInput(form);
    if (!email || !pwd) throw new Error('No hay inputs de email/password en el formulario');

    fireEvent.change(email, { target: { value: 'ok@x.com' } });
    fireEvent.change(pwd,   { target: { value: '123456789012' } });
    fireEvent.submit(form); // ← más robusto que clickar por el texto del botón
}

describe('Login – email flow navega según perfil', () => {
    beforeEach(() => {
        signInWithEmailAndPassword.mockReset();
        getProfile.mockReset();
        nav.navigate.mockReset();
    });

    test('con perfil → /dashboard', async () => {
        signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'u1' } });
        getProfile.mockResolvedValueOnce({ data: { id: 'p1' } });

        render(<Login />);
        fillAndSubmit();

        await waitFor(() => expect(getProfile).toHaveBeenCalled());
        expect(nav.navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    test('sin perfil (error al consultar) → /onboarding', async () => {
        signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'u1' } });
        getProfile.mockRejectedValueOnce(new Error('no profile'));

        render(<Login />);
        fillAndSubmit();

        await waitFor(() => expect(getProfile).toHaveBeenCalled());
        expect(nav.navigate).toHaveBeenCalledWith('/onboarding', { replace: true });
    });
});
