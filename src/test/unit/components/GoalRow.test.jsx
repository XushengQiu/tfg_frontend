// src/test/unit/components/GoalRow.test.jsx
import { render, screen } from '@testing-library/react';
import GoalRow from '../../../components/GoalRow.jsx';

const base = {
    _id: '1', nombre: 'Meta', duracionUnidad: 'Indefinido',
    duracionValor: null, tipo: 'Bool', finalizado: false
};

test('muestra acciones cuando NO está finalizada', () => {
    render(<table><tbody>
    <GoalRow goal={base} createdLabel={()=>'hoy'} objectiveLabel={()=>'Check'} onSelect={()=>{}}/>
    </tbody></table>);
    expect(screen.getByRole('button', {name:/registro/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name:/finalizar/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name:/editar/i})).toBeInTheDocument();
});

test('muestra COMPLETADA y Eliminar cuando está finalizada', () => {
    render(<table><tbody>
    <GoalRow goal={{...base, finalizado:true}} createdLabel={()=>'hoy'} objectiveLabel={()=>'Check'} onSelect={()=>{}}/>
    </tbody></table>);
    expect(screen.getByText(/completada/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name:/eliminar/i})).toBeInTheDocument();
});
