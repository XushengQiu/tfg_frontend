import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Modal from '../../../components/Modal';

vi.useFakeTimers();

test('overlay cierra, scroll habilita aceptar y blocker muestra hint', () => {
    const onClose = vi.fn();
    const onAccept = vi.fn();

    const { container } = render(
        <Modal open title="T" onClose={onClose} onAccept={onAccept} acceptText="Aceptar" requireScroll>
            <div style={{ height: 1200 }}>contenido largo</div>
        </Modal>
    );

    const btn = screen.getByRole('button', { name: 'Aceptar' });
    expect(btn).toBeDisabled();

    const blocker = container.querySelector('.accept-blocker');
    fireEvent.click(blocker);
    vi.advanceTimersByTime(20);

    const body = container.querySelector('.modal-body');
    Object.defineProperty(body, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(body, 'clientHeight', { value: 200, configurable: true });
    body.scrollTop = 900;
    fireEvent.scroll(body);
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);
    expect(onAccept).toHaveBeenCalled();

    fireEvent.click(container.querySelector('.modal-overlay'));
    expect(onClose).toHaveBeenCalled();
});
