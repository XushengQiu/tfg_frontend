import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Modal from '../../../components/Modal.jsx';

describe('Modal (comportamiento extra)', () => {
    test('overlay click cierra el modal cuando overlayClick=true por defecto', () => {
        const onClose = vi.fn();
        render(
            <Modal open title="Demo" onClose={onClose}>
                <div>contenido</div>
            </Modal>
        );
        fireEvent.click(document.querySelector('.modal-overlay'));
        expect(onClose).toHaveBeenCalled();
    });

    test('acceptStyle="danger" habilita aceptar sin requireScroll', () => {
        const onAccept = vi.fn();
        render(
            <Modal open title="Eliminar" acceptStyle="danger" onAccept={onAccept} onClose={() => {}}>
                <div>¿Seguro?</div>
            </Modal>
        );
        fireEvent.click(screen.getByRole('button', { name: /aceptar/i }));
        expect(onAccept).toHaveBeenCalled();
    });

    test('denyStyle="muted" muestra botón Cerrar y respeta showCloseIcon=false', () => {
        const onClose = vi.fn();
        render(
            <Modal
                open
                title="Info"
                onClose={onClose}
                denyStyle="muted"
                showCloseIcon={false}
            >
                <div>texto</div>
            </Modal>
        );
        // hay botón Cerrar (deny)
        fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));
        expect(onClose).toHaveBeenCalled();
        // no hay aspa de cierre
        expect(document.querySelector('.modal-close')).toBeNull();
    });

    test('showDenyButton={false} oculta el botón de cerrar (footer)', () => {
        const { container } = render(
            <Modal open title="x" onClose={() => {}} showDenyButton={false}>
                ok
            </Modal>
        );
        // El aspa tiene aria-label="Cerrar"; aquí buscamos el TEXTO visible "Cerrar" del botón del footer
        expect(within(container).queryByText(/^cerrar$/i)).toBeNull();
    });
});
