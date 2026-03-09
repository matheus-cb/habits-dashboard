import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useWeeklyCalendar } from '@/hooks/useWeeklyCalendar';
import { habitsApi } from '@/lib/api/habits';
import WeeklyGrid from '@/components/WeeklyGrid';
import ScheduleModal from '@/components/ScheduleModal';
import type { Habit } from '@/types';
import type { CellInfo } from '@/hooks/useWeeklyCalendar';

export default function CalendarPage() {
  const { user, logout } = useAuth();
  const { habits, checkinsMap, loading, error, refresh } = useAnalytics();
  const { weekDays, cellStateMap, weeklySummary, goToPrevWeek, goToNextWeek } =
    useWeeklyCalendar(habits, checkinsMap);

  const [scheduleHabit, setScheduleHabit] = useState<Habit | null>(null);

  async function handleCellClick(habit: Habit, day: Date, cellInfo: CellInfo) {
    const { state, checkinId } = cellInfo;

    // Células futuras e vazias não são acionáveis
    if (state === 'future-planned' || state === 'empty') return;

    const dateStr = format(day, 'yyyy-MM-dd');

    if (state === 'done' || state === 'bonus') {
      // Toggle: remove o check-in
      if (checkinId) {
        await habitsApi.deleteCheckin(habit.id, checkinId);
        await refresh();
      }
    } else {
      // missed / today-planned / today-unplanned → cria check-in
      try {
        await habitsApi.checkin(habit.id, dateStr);
        await refresh();
      } catch {
        // 409 = duplicata, ignorar silenciosamente
      }
    }
  }

  function handleScheduleClick(habit: Habit) {
    setScheduleHabit(habit);
  }

  const weekLabel = (() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${format(start, 'd')} – ${format(end, 'd')} de ${format(start, 'MMMM yyyy', { locale: ptBR })}`;
    }
    return `${format(start, 'd MMM', { locale: ptBR })} – ${format(end, 'd MMM yyyy', { locale: ptBR })}`;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium">
            ← Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 text-sm"
              >
                ← Hábitos
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
                <p className="text-sm text-gray-500">Planejamento e acompanhamento semanal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/analytics"
                className="text-gray-600 hover:text-purple-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Análises
              </Link>
              <span className="text-sm text-gray-500 hidden sm:block">{user?.name}</span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {habits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500 text-lg mb-2">Nenhum hábito encontrado</p>
            <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium">
              Criar seu primeiro hábito →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Navegador de semana */}
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm px-5 py-3">
              <button
                onClick={goToPrevWeek}
                className="text-gray-500 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors text-lg"
                aria-label="Semana anterior"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-gray-700 capitalize">
                Semana de {weekLabel}
              </span>
              <button
                onClick={goToNextWeek}
                className="text-gray-500 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors text-lg"
                aria-label="Próxima semana"
              >
                ›
              </button>
            </div>

            {/* Grade semanal */}
            <WeeklyGrid
              habits={habits}
              weekDays={weekDays}
              cellStateMap={cellStateMap}
              onCellClick={handleCellClick}
              onScheduleClick={handleScheduleClick}
            />

            {/* Resumo da semana */}
            {weeklySummary.planned > 0 && (
              <div className="bg-white rounded-xl shadow-sm px-5 py-4 text-sm text-gray-600">
                <span className="font-semibold text-gray-800">
                  {weeklySummary.done} de {weeklySummary.planned}
                </span>{' '}
                hábitos planejados concluídos esta semana
                {weeklySummary.planned > 0 && (
                  <span className="ml-1 text-purple-600 font-semibold">
                    ({Math.round((weeklySummary.done / weeklySummary.planned) * 100)}%)
                  </span>
                )}
              </div>
            )}

            {/* Legenda */}
            <div className="bg-white rounded-xl shadow-sm px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Legenda</p>
              <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs">✓</span>
                  Concluído
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full border-2 border-purple-400 bg-white" />
                  Não realizado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-xs">✓</span>
                  Bônus
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 bg-white" />
                  Agendado (futuro)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-300 font-bold">—</span>
                  Não agendado
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de agenda */}
      {scheduleHabit && (
        <ScheduleModal
          habit={scheduleHabit}
          onClose={() => setScheduleHabit(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
