import { useState } from 'react';
import { format, isFuture, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { habitsApi } from '@/lib/api/habits';
import type { Habit, Checkin } from '@/types';

interface DayDetailPanelProps {
  selectedDay: Date;
  habits: Habit[];
  checkinsMap: Record<string, Checkin[]>;
  isHabitEnabled: (habitId: string) => boolean;
  reminders: Record<string, string>;
  onToggleHabit: (habitId: string) => void;
  onSetReminder: (habitId: string, time: string) => void;
  onRemoveReminder: (habitId: string) => void;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

function getCheckinForDay(
  habitId: string,
  day: Date,
  checkinsMap: Record<string, Checkin[]>
): Checkin | undefined {
  const dayStr = format(day, 'yyyy-MM-dd');
  return (checkinsMap[habitId] ?? []).find(c => {
    return format(new Date(c.date), 'yyyy-MM-dd') === dayStr;
  });
}

export default function DayDetailPanel({
  selectedDay,
  habits,
  checkinsMap,
  isHabitEnabled,
  reminders,
  onToggleHabit,
  onSetReminder,
  onRemoveReminder,
  onClose,
  onRefresh,
}: DayDetailPanelProps) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [reminderOpenId, setReminderOpenId] = useState<string | null>(null);

  const dayLabel = format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR });
  const dateStr = format(selectedDay, 'yyyy-MM-dd');
  const isFutureDay = isFuture(startOfDay(selectedDay)) && !isSameDay(selectedDay, new Date());

  const enabledHabits = habits.filter(h => isHabitEnabled(h.id));
  const disabledHabits = habits.filter(h => !isHabitEnabled(h.id));

  async function handleToggleCheckin(habit: Habit) {
    const existing = getCheckinForDay(habit.id, selectedDay, checkinsMap);
    setLoadingIds(prev => new Set(prev).add(habit.id));
    try {
      if (existing) {
        await habitsApi.deleteCheckin(habit.id, existing.id);
      } else {
        await habitsApi.checkinByDate(habit.id, dateStr);
      }
      await onRefresh();
    } catch {
      // silently ignore conflict (409) — checkin already exists
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(habit.id);
        return next;
      });
    }
  }

  function handleReminderChange(habitId: string, time: string) {
    if (time) {
      onSetReminder(habitId, time);
    } else {
      onRemoveReminder(habitId);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Dia selecionado</p>
          <h3 className="text-base font-semibold text-gray-900 capitalize">{dayLabel}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fechar painel"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {isFutureDay && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            Dia futuro — check-ins não permitidos.
          </p>
        )}

        {enabledHabits.length === 0 && disabledHabits.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            Nenhum hábito cadastrado.
          </p>
        )}

        {/* Hábitos habilitados */}
        {enabledHabits.map(habit => {
          const checkin = getCheckinForDay(habit.id, selectedDay, checkinsMap);
          const isDone = !!checkin;
          const isLoading = loadingIds.has(habit.id);
          const hasReminder = !!reminders[habit.id];
          const isReminderOpen = reminderOpenId === habit.id;

          return (
            <div
              key={habit.id}
              className="rounded-lg border border-gray-100 p-3 hover:border-purple-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Toggle check-in */}
                <button
                  onClick={() => !isFutureDay && handleToggleCheckin(habit)}
                  disabled={isLoading || isFutureDay}
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors flex-shrink-0',
                    isDone
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200',
                    isFutureDay ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                    isLoading ? 'animate-pulse' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={isDone ? 'Desmarcar check-in' : 'Marcar check-in'}
                >
                  {isDone ? '✓' : '○'}
                </button>

                <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                  {habit.title}
                </span>

                {/* Botão de lembrete */}
                <button
                  onClick={() => setReminderOpenId(isReminderOpen ? null : habit.id)}
                  className={[
                    'p-1.5 rounded-lg transition-colors text-sm',
                    hasReminder
                      ? 'bg-purple-100 text-purple-600'
                      : 'hover:bg-gray-100 text-gray-400',
                  ].join(' ')}
                  title={hasReminder ? `Lembrete: ${reminders[habit.id]}` : 'Definir lembrete'}
                >
                  🔔
                </button>

                {/* Botão desabilitar */}
                <button
                  onClick={() => onToggleHabit(habit.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors text-xs"
                  title="Desabilitar no calendário"
                >
                  ✕
                </button>
              </div>

              {/* Input de lembrete */}
              {isReminderOpen && (
                <div className="mt-2 flex items-center gap-2 pl-11">
                  <input
                    type="time"
                    value={reminders[habit.id] ?? ''}
                    onChange={e => handleReminderChange(habit.id, e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  {hasReminder && (
                    <button
                      onClick={() => {
                        onRemoveReminder(habit.id);
                        setReminderOpenId(null);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remover
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Hábitos desabilitados */}
        {disabledHabits.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              Desabilitados no calendário
            </p>
            {disabledHabits.map(habit => (
              <div
                key={habit.id}
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 mb-1"
              >
                <span className="flex-1 text-sm text-gray-400 truncate">{habit.title}</span>
                <button
                  onClick={() => onToggleHabit(habit.id)}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  Habilitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
