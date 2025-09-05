import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// 1) Mock router
const nav = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router-dom', async (orig) => {
    const m = await orig();
    return { ...m, useNavigate: () => nav.navigate };
});

// 2) Mock firebase/auth
const auth = vi.hoisted(() => ({
    getAuth: vi.fn(() => ({})),
    createUserWithEmailAndPassword: vi.fn(),
    GoogleAuthProvider: vi.fn(function GoogleAuthProvider(){}),
    signInWithPopup: vi.fn(),
}));
vi.mock('firebase/auth', () => auth);

// 3) Mock api (inocuo aquí)
vi.mock('../../../services/api.js', () => ({ getProfile: vi.fn() }));

// 4) Mock auth-context
const ctx = vi.hoisted(() => ({
    useAuth: () => ({ user: null, profile: null, login: vi.fn(), logout: vi.fn() }),
}));
vi.mock('../../../auth-context.jsx', () => ctx);

// 5) Import después de mocks
import Login from '../../../pages/Login.jsx';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// -------- helpers para inputs robustos --------
function getScopedFormForCreate() {
    const createBtn = screen.getByRole('button', { name: /crear cuenta/i });
    return createBtn.closest('form') || document.querySelector('form') || document.body;
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

describe('Login – registro', () => {
    beforeEach(() => {
        createUserWithEmailAndPassword.mockReset();
        nav.navigate.mockReset();
    });

    test('contraseña < 12 muestra toast y NO llama a createUserWithEmailAndPassword', () => {
        render(<Login />);

        const form = getScopedFormForCreate();
        const email = getEmailInput(form);
        const pwd   = getPasswordInput(form);
        if (!email || !pwd) throw new Error('No se encontraron los inputs de correo/contraseña en el formulario de registro');

        fireEvent.change(email, { target: { value: 'ana@x.com' } });
        fireEvent.change(pwd,   { target: { value: 'corta' } });
        fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

        expect(screen.getByText(/registro de cuenta/i)).toBeInTheDocument();
        expect(screen.getByText(/al menos 12 caracteres/i)).toBeInTheDocument();
        expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    test('happy path: crea cuenta y navega a /onboarding', async () => {
        createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'u1' } });

        render(<Login />);

        const form = getScopedFormForCreate();
        const email = getEmailInput(form);
        const pwd   = getPasswordInput(form);
        if (!email || !pwd) throw new Error('No se encontraron los inputs de correo/contraseña en el formulario de registro');

        fireEvent.change(email, { target: { value: 'ana@x.com' } });
        fireEvent.change(pwd,   { target: { value: 'Abcdefghij1@' } });
        fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

        await waitFor(() => expect(createUserWithEmailAndPassword).toHaveBeenCalled());
        expect(nav.navigate).toHaveBeenCalledWith('/onboarding', { replace: true });
    });
});
