import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCalendar } from '@/hooks/useCalendar';
import { useHabitPreferences } from '@/hooks/useHabitPreferences';
import { useReminderNotifications } from '@/hooks/useReminderNotifications';
import CalendarGrid from '@/components/CalendarGrid';
import DayDetailPanel from '@/components/DayDetailPanel';

export default function CalendarPage() {
  const { user, logout } = useAuth();
  const { habits, checkinsMap, loading, error, refresh } = useAnalytics();
  const { currentMonth, selectedDay, goToPrevMonth, goToNextMonth, selectDay, calendarDays, checkinsDateMap } =
    useCalendar(checkinsMap);
  const { enabledHabits, reminders, isHabitEnabled, toggleHabit, setReminder, removeReminder } =
    useHabitPreferences();

  useReminderNotifications(habits, reminders);

  const enabledHabitIds = habits.filter(h => isHabitEnabled(h.id)).map(h => h.id);

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
                <p className="text-sm text-gray-500">Visualize seus hábitos mês a mês</p>
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
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendário — 2/3 da largura em desktop */}
            <div className={selectedDay ? 'lg:w-2/3' : 'w-full'}>
              <CalendarGrid
                currentMonth={currentMonth}
                calendarDays={calendarDays}
                checkinsDateMap={checkinsDateMap}
                enabledHabitIds={enabledHabitIds}
                habits={habits}
                selectedDay={selectedDay}
                onPrevMonth={goToPrevMonth}
                onNextMonth={goToNextMonth}
                onDayClick={selectDay}
              />

              {/* Gerenciar visibilidade dos hábitos */}
              <div className="mt-6 bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Visibilidade no Calendário
                </h3>
                <div className="flex flex-wrap gap-2">
                  {habits.map(habit => {
                    const enabled = isHabitEnabled(habit.id);
                    return (
                      <button
                        key={habit.id}
                        onClick={() => toggleHabit(habit.id)}
                        className={[
                          'text-xs px-3 py-1.5 rounded-full border transition-colors font-medium',
                          enabled
                            ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200'
                            : 'bg-gray-100 border-gray-200 text-gray-400 hover:bg-gray-200',
                        ].join(' ')}
                      >
                        {enabled ? '● ' : '○ '}
                        {habit.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Painel lateral — 1/3 da largura em desktop */}
            {selectedDay && (
              <div className="lg:w-1/3">
                <DayDetailPanel
                  selectedDay={selectedDay}
                  habits={habits}
                  checkinsMap={checkinsMap}
                  isHabitEnabled={isHabitEnabled}
                  reminders={reminders}
                  onToggleHabit={toggleHabit}
                  onSetReminder={setReminder}
                  onRemoveReminder={removeReminder}
                  onClose={() => selectDay(selectedDay)}
                  onRefresh={refresh}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
