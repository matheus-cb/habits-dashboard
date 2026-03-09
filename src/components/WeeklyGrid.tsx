import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Habit } from '@/types';
import type { CellState, CellInfo } from '@/hooks/useWeeklyCalendar';

interface WeeklyGridProps {
  habits: Habit[];
  weekDays: Date[];
  cellStateMap: Record<string, Record<string, CellInfo>>;
  onCellClick: (habit: Habit, day: Date, cellInfo: CellInfo) => void;
  onScheduleClick: (habit: Habit) => void;
}

const DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

function CellButton({
  cellInfo,
  day,
  onClick,
}: {
  cellInfo: CellInfo;
  day: Date;
  onClick?: () => void;
}) {
  const { state } = cellInfo;
  const todayFlag = isToday(day);

  const isClickable =
    state === 'done' ||
    state === 'missed' ||
    state === 'bonus' ||
    state === 'today-planned' ||
    state === 'today-unplanned';

  if (state === 'empty') {
    return (
      <div className="flex items-center justify-center w-9 h-9">
        <span className="text-gray-300 text-sm select-none">—</span>
      </div>
    );
  }

  const baseClasses = 'flex items-center justify-center w-9 h-9 rounded-full transition-all select-none';
  const todayRing = todayFlag ? 'ring-2 ring-offset-1 ring-purple-400' : '';

  let inner: React.ReactNode;
  let colorClasses: string;

  switch (state) {
    case 'done':
      colorClasses = 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer';
      inner = <span className="text-sm">✓</span>;
      break;
    case 'missed':
      colorClasses = 'border-2 border-purple-400 bg-white text-purple-400 hover:bg-purple-50 cursor-pointer';
      inner = null;
      break;
    case 'bonus':
      colorClasses = 'bg-purple-200 text-purple-700 hover:bg-purple-300 cursor-pointer';
      inner = <span className="text-sm">✓</span>;
      break;
    case 'future-planned':
      colorClasses = 'border-2 border-dashed border-gray-300 bg-white text-gray-300 cursor-default';
      inner = null;
      break;
    case 'today-planned':
      colorClasses = 'border-2 border-purple-500 bg-white text-purple-500 hover:bg-purple-50 cursor-pointer';
      inner = null;
      break;
    case 'today-unplanned':
      colorClasses = 'border border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100 cursor-pointer';
      inner = <span className="text-xs text-gray-300">+</span>;
      break;
    default:
      colorClasses = '';
      inner = null;
  }

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      className={[baseClasses, colorClasses, todayRing].filter(Boolean).join(' ')}
      title={stateLabel(state)}
    >
      {inner}
    </button>
  );
}

function stateLabel(state: CellState): string {
  const labels: Record<CellState, string> = {
    done: 'Concluído',
    missed: 'Não realizado',
    bonus: 'Bônus',
    'future-planned': 'Agendado',
    'today-planned': 'Agendado para hoje',
    'today-unplanned': 'Clique para registrar',
    empty: '',
  };
  return labels[state] ?? '';
}

export default function WeeklyGrid({
  habits,
  weekDays,
  cellStateMap,
  onCellClick,
  onScheduleClick,
}: WeeklyGridProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-500 w-48">
              Hábito
            </th>
            {weekDays.map((day, i) => (
              <th
                key={day.toISOString()}
                className={[
                  'text-center px-2 py-3 text-xs font-semibold w-12',
                  isToday(day) ? 'text-purple-600' : 'text-gray-500',
                ].join(' ')}
              >
                <div>{DAY_LABELS[i]}</div>
                <div
                  className={[
                    'text-base font-bold mt-0.5',
                    isToday(day) ? 'text-purple-600' : 'text-gray-700',
                  ].join(' ')}
                >
                  {format(day, 'd', { locale: ptBR })}
                </div>
              </th>
            ))}
            <th className="w-10 px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {habits.map((habit, idx) => (
            <tr
              key={habit.id}
              className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
            >
              <td className="px-4 py-2">
                <span
                  className="text-sm font-medium text-gray-800 truncate block max-w-[160px]"
                  title={habit.title}
                >
                  {habit.title}
                </span>
              </td>
              {weekDays.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const cellInfo = cellStateMap[habit.id]?.[key] ?? { state: 'empty' as CellState };
                return (
                  <td key={day.toISOString()} className="text-center px-2 py-2">
                    <div className="flex items-center justify-center">
                      <CellButton
                        cellInfo={cellInfo}
                        day={day}
                        onClick={() => onCellClick(habit, day, cellInfo)}
                      />
                    </div>
                  </td>
                );
              })}
              <td className="text-center px-2 py-2">
                <button
                  onClick={() => onScheduleClick(habit)}
                  className="text-gray-400 hover:text-purple-600 transition-colors p-1 rounded"
                  title="Configurar agenda"
                >
                  ⚙
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
