// src/test/unit/components/Modal.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../../components/Modal.jsx';

test('no permite aceptar hasta llegar al final con requireScroll', () => {
    const onAccept = vi.fn();
    render(
        <Modal open title="Términos" requireScroll onAccept={onAccept} onClose={() => {}}>
            <div style={{height: 1_000}}>contenido largo</div>
        </Modal>
    );
    const aceptar = screen.getByRole('button', { name: /aceptar/i });
    expect(aceptar).toBeDisabled();
    const body = screen.getByRole('document'); // .modal-body
    fireEvent.scroll(body, { target: { scrollTop: 10_000 } });
    expect(aceptar).not.toBeDisabled();
});
