import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../firebase', () => ({ auth: {}, googleProvider: {} }));

vi.mock('../../../services/api', () => ({ getProfile: vi.fn() }));
vi.mock('../../../auth-context', () => ({ useAuth: () => ({ login: vi.fn() }) }));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({ currentUser: null })),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
}));

vi.mock('../../../assets/icons/google_logo.png', () => ({ default: 'x.png' }));
vi.mock('../../../assets/media/library_1536x1760.png', () => ({ default: 'bg.png' }));
vi.mock('../../../assets/icons/informacion.png', () => ({ default: 'i.png' }));
vi.mock('../../../components/TermsContent', () => ({ default: () => <div>terms</div> }));
vi.mock('../../../components/DataPolicyContent', () => ({ default: () => <div>data</div> }));
vi.mock('../../../components/Modal', () => ({
    default: (props) =>
        props.open ? (
            <div className="modal-overlay" onClick={(e)=>e.target===e.currentTarget&&props.onClose?.()}>
                <div className="modal">
                    <h2>{props.title}</h2>
                    <div className="modal-body">{props.children}</div>
                    <div className="modal-actions">
                        {props.onClose && <button onClick={props.onClose}>Cerrar</button>}
                        {props.onAccept && <button onClick={props.onAccept}>Aceptar</button>}
                    </div>
                    <div className="modal-scroll-hint" />
                </div>
            </div>
        ) : null
}));

import { getProfile } from '../../../services/api';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
} from 'firebase/auth';
import Login from '../../../pages/Login';

beforeEach(() => vi.clearAllMocks());

test('login con email → dashboard si hay perfil', async () => {
    signInWithEmailAndPassword.mockResolvedValue({});
    getProfile.mockResolvedValue({});
    const { container } = render(<Login />);
    await userEvent.type(screen.getByLabelText(/correo/i), 'a@b.com');
    const pwd = container.querySelector('input[type="password"]');
    if (!pwd) throw new Error('password input not found');
    await userEvent.type(pwd, 'supersecretpass');
    await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /login/i }));
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
});

test('login con email → onboarding si NO hay perfil', async () => {
    signInWithEmailAndPassword.mockResolvedValue({});
    getProfile.mockRejectedValue(new Error('no profile'));
    const { container } = render(<Login />);
    await userEvent.type(screen.getByLabelText(/correo/i), 'a@b.com');
    const pwd = container.querySelector('input[type="password"]');
    if (!pwd) throw new Error('password input not found');
    await userEvent.type(pwd, 'supersecretpass');
    await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /login/i }));
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/onboarding', { replace: true }));
});

test('registro con contraseña corta muestra aviso y NO llama a firebase', async () => {
    const { container } = render(<Login />);
    await userEvent.type(screen.getByLabelText(/correo/i), 'a@b.com');
    const pwd = container.querySelector('input[type="password"]');
    if (!pwd) throw new Error('password input not found');
    await userEvent.type(pwd, 'corta')
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    expect(await screen.findByText(/al menos 12 caracteres/i)).toBeInTheDocument();
});

test('reset password: abre modal, valida vacío y éxito', async () => {
    sendPasswordResetEmail.mockResolvedValue({});
    const { container } = render(<Login />);
    await userEvent.click(screen.getByRole('button', { name: /¿has olvidado tu contraseña\?/i }));
    expect(screen.getByRole('heading', { name: /restablecer contraseña/i })).toBeInTheDocument();

    const modal = container.querySelector('.modal');
    const emailInModal = within(modal).getByLabelText(/correo electrónico/i);
    await userEvent.type(emailInModal, 'x@y.com');
    await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /enviar enlace/i }));
    });
    expect(await screen.findByText(/si existe una cuenta asociada/i)).toBeInTheDocument();
});

test('UI: toggle ver/ocultar contraseña e info', async () => {
    const { container } = render(<Login />);
    const pwd = container.querySelector('input[type="password"]');
    if (!pwd) throw new Error('password input not found');
    await userEvent.type(pwd, 'supersecretpass');
    const eyeBtn = screen.getByRole('button', { name: /mostrar contraseña|ocultar contraseña/i });
    await userEvent.click(eyeBtn);
    const infoBtn = screen.getByRole('button', { name: /requisitos de contraseña/i });
    await userEvent.click(infoBtn);
    expect(await screen.findByText(/requisitos de contraseña/i)).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
});
