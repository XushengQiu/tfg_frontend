// src/test/unit/components/GoalInsight.test.jsx
import { render } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import GoalInsight from '../../../components/GoalInsight.jsx';

const gNum = { tipo: 'Num', nombre:'x' };
const gBool = { tipo: 'Bool', nombre:'y' };

describe('GoalInsight', () => {
    test('Num: no muestra calendar-grid', () => {
        const { container } = render(<GoalInsight goal={{ tipo:'Num', nombre:'X', registros: [] }} />);
        expect(container.querySelector('.calendar-grid')).toBeNull();
    });

    test('Bool: muestra calendar-grid', () => {
        const goal = {
            tipo: 'Bool',
            nombre: 'Y',
            registros: [{ fecha: '2024-01-15', valorBool: true }],
        };
        const { container } = render(<GoalInsight goal={goal} />);
        expect(container.querySelector('.calendar-grid')).not.toBeNull();
    });
});
