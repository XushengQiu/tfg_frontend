import React from 'react';
import { render, screen, within, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
afterEach(() => cleanup());
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('driver.js', () => {
    const drive = vi.fn();
    const factory = vi.fn(() => ({ drive }));
    return { driver: factory };
});
vi.mock('driver.js/dist/driver.css', () => ({}));
vi.mock('../../../assets/icons/tutorial.png', () => ({ default: 't.png' }));

import { driver as driverFactory } from 'driver.js';
import NewGoalModal from '../../../components/NewGoalModal';

test('tutorial: pulsa ayuda y se invoca driver().drive()', async () => {
    render(<NewGoalModal open onCreate={() => {}} onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /abrir tutorial/i }));
    expect(driverFactory).toHaveBeenCalled();
    const instance = driverFactory.mock.results[0].value;
    expect(instance.drive).toHaveBeenCalled();
});

test('submit (bool + indefinido) llama onCreate', async () => {
    const onCreate = vi.fn();
    render(<NewGoalModal open onCreate={onCreate} onClose={() => {}} />);

    await userEvent.type(screen.getByLabelText(/nombre\*/i), 'Leer');
    const period = document.getElementById('newgoal-period');
    const indef = within(period).getByRole('checkbox', { name: /indefinido/i });
    await userEvent.click(indef);
    const obj = document.getElementById('newgoal-obj');
    const check = within(obj).getByRole('checkbox', { name: /check/i });
    await userEvent.click(check);
    await userEvent.click(screen.getByRole('button', { name: /crear/i }));

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
        tipo: 'bool',
        periodoIndef: true,
        nombre: 'Leer',
    }));
});
