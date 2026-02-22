import { format, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Habit } from '@/types';

const HABIT_COLORS = [
  '#7c3aed', // purple
  '#2563eb', // blue
  '#16a34a', // green
  '#d97706', // amber
  '#dc2626', // red
  '#0891b2', // cyan
  '#db2777', // pink
  '#65a30d', // lime
];

function getHabitColor(index: number): string {
  return HABIT_COLORS[index % HABIT_COLORS.length];
}

interface CalendarGridProps {
  currentMonth: Date;
  calendarDays: Date[];
  checkinsDateMap: Record<string, string[]>;
  enabledHabitIds: string[];
  habits: Habit[];
  selectedDay: Date | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarGrid({
  currentMonth,
  calendarDays,
  checkinsDateMap,
  enabledHabitIds,
  habits,
  selectedDay,
  onPrevMonth,
  onNextMonth,
  onDayClick,
}: CalendarGridProps) {
  const habitColorMap: Record<string, string> = {};
  habits.forEach((h, i) => {
    habitColorMap[h.id] = getHabitColor(i);
  });

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: ptBR });

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      {/* Header: navegação de mês */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Mês anterior"
        >
          &#8249;
        </button>
        <h2 className="text-lg font-semibold text-gray-900 capitalize">{monthLabel}</h2>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Próximo mês"
        >
          &#8250;
        </button>
      </div>

      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 mb-2">
        {WEEK_DAYS.map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const todayHighlight = isToday(day);
          const isSelected =
            selectedDay && format(selectedDay, 'yyyy-MM-dd') === dateKey;

          const checkedHabitIds = (checkinsDateMap[dateKey] ?? []).filter(id =>
            enabledHabitIds.includes(id)
          );

          return (
            <button
              key={idx}
              onClick={() => onDayClick(day)}
              className={[
                'relative flex flex-col items-center rounded-lg py-1 px-0.5 min-h-[52px] transition-colors',
                isCurrentMonth ? 'hover:bg-purple-50' : 'opacity-40',
                todayHighlight
                  ? 'ring-2 ring-purple-500'
                  : '',
                isSelected
                  ? 'bg-purple-100 ring-2 ring-purple-600'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={[
                  'text-sm font-medium leading-none mb-1',
                  todayHighlight ? 'text-purple-700' : 'text-gray-700',
                  !isCurrentMonth ? 'text-gray-300' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {format(day, 'd')}
              </span>

              {/* Dots dos hábitos */}
              {checkedHabitIds.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
                  {checkedHabitIds.slice(0, 5).map(habitId => (
                    <span
                      key={habitId}
                      className="block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: habitColorMap[habitId] ?? '#7c3aed' }}
                    />
                  ))}
                  {checkedHabitIds.length > 5 && (
                    <span className="text-[8px] text-gray-400 leading-none">
                      +{checkedHabitIds.length - 5}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda de cores */}
      {habits.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1">
          {habits.map((habit, i) => (
            <div key={habit.id} className="flex items-center gap-1.5">
              <span
                className="block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getHabitColor(i) }}
              />
              <span className="text-xs text-gray-600 truncate max-w-[100px]" title={habit.title}>
                {habit.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
