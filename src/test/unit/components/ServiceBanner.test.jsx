import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import ServiceBanner from '../../../components/ServiceBanner';

describe('ServiceBanner', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    test('no renderiza nada en estado OK y se mantiene oculto tras net:ok', () => {
        const { container } = render(<ServiceBanner />);
        expect(container.firstChild).toBeNull();

        act(() => {
            window.dispatchEvent(new CustomEvent('net:ok', { detail: {} }));
        });

        expect(container.firstChild).toBeNull();
    });

    test('muestra banner con 429 y cuenta atrás; luego se oculta con net:ok', () => {
        render(<ServiceBanner />);

        act(() => {
            window.dispatchEvent(new CustomEvent('net:degraded', {
                detail: { status: 429, retryIn: 1500, attempt: 1 }
            }));
        });

        const banner = screen.getByRole('status');
        expect(banner).toBeInTheDocument();
        expect(screen.getByText(/Demasiadas peticiones/i)).toBeInTheDocument();
        expect(screen.getByText(/Reintentando en 2s/i)).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(1000); });
        expect(screen.getByText(/Reintentando en 1s/i)).toBeInTheDocument();

        act(() => {
            window.dispatchEvent(new CustomEvent('net:ok', { detail: {} }));
        });
        // el nodo se desmonta
        expect(screen.queryByRole('status')).toBeNull();
    });

    test('muestra banner con 503 sin retryIn (mensaje estático)', () => {
        render(<ServiceBanner />);

        act(() => {
            window.dispatchEvent(new CustomEvent('net:degraded', {
                detail: { status: 503, retryIn: null, attempt: 3 }
            }));
        });

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText(/Mucho tráfico/i)).toBeInTheDocument();
        expect(screen.getByText(/Volveremos a intentarlo/i)).toBeInTheDocument();
    });

    test('botón "Reintentar ahora" llama a window.location.reload', () => {
        // mock seguro de reload en jsdom
        const original = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...original, reload: vi.fn() }
        });

        render(<ServiceBanner />);
        act(() => {
            window.dispatchEvent(new CustomEvent('net:degraded', {
                detail: { status: 'network', retryIn: 1000 }
            }));
        });

        fireEvent.click(screen.getByRole('button', { name: /reintentar ahora/i }));
        expect(window.location.reload).toHaveBeenCalled();

        Object.defineProperty(window, 'location', { configurable: true, value: original });
    });

    test('al desmontar, no deja contadores activos ni reaparece', () => {
        const { unmount, queryByRole } = render(<ServiceBanner />);

        act(() => {
            window.dispatchEvent(new CustomEvent('net:degraded', {
                detail: { status: 429, retryIn: 1200 }
            }));
        });
        expect(queryByRole('status')).toBeInTheDocument();

        unmount();

        act(() => {
            window.dispatchEvent(new CustomEvent('net:degraded', {
                detail: { status: 429, retryIn: 1200 }
            }));
            vi.advanceTimersByTime(2000);
        });

        expect(queryByRole('status')).toBeNull();
    });
});
