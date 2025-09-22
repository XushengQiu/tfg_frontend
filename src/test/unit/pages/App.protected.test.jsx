// src/test/unit/pages/App.protected.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

// Mockea el contexto para controlar user
vi.mock('../../../auth-context.jsx', () => {
    return {
        useAuth: () => ({ user: null }),
        AuthProvider: ({ children }) => <>{children}</>,
    };
});

import App from '../../../App.jsx';

describe('Protected routes', () => {
    test('sin user → muestra Login', () => {
        render(<App />);
        expect(screen.getByText(/iniciar sesión con google/i)).toBeInTheDocument();
    });
});
