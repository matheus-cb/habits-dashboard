import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHabits } from '@/hooks/useHabits';
import HabitCard from '@/components/HabitCard';
import CreateHabitModal from '@/components/CreateHabitModal';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { habits, loading, createHabit, deleteHabit, checkin } = useHabits();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [doneTodayMap, setDoneTodayMap] = useState<Record<string, boolean>>({});
  const [bestStreakMap, setBestStreakMap] = useState<Record<string, number>>({});

  const handleDoneTodayChange = useCallback((habitId: string, done: boolean) => {
    setDoneTodayMap(prev => ({ ...prev, [habitId]: done }));
  }, []);

  const handleStatsLoaded = useCallback((habitId: string, bestStreak: number) => {
    setBestStreakMap(prev => ({ ...prev, [habitId]: bestStreak }));
  }, []);

  const doneTodayCount = Object.values(doneTodayMap).filter(Boolean).length;
  const bestStreak = Math.max(0, ...Object.values(bestStreakMap));

  async function handleCreateHabit(data: { title: string; description?: string }) {
    try {
      await createHabit(data);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Erro ao criar hábito:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando hábitos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meus Hábitos</h1>
              <p className="text-sm text-gray-600 mt-1">
                Olá, {user?.name || 'Usuário'}! 👋
              </p>
            </div>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600">{habits?.length || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Hábitos Ativos</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">{doneTodayCount}</div>
            <div className="text-sm text-gray-600 mt-1">Concluídos Hoje</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-orange-600">🔥 {bestStreak}</div>
            <div className="text-sm text-gray-600 mt-1">Melhor Sequência</div>
          </div>
        </div>

        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Criar Novo Hábito
          </button>
        </div>

        {/* Habits Grid */}
        {!habits || habits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">Você ainda não tem hábitos</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Crie seu primeiro hábito
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onCheckin={() => checkin(habit.id)}
                onDelete={() => deleteHabit(habit.id)}
                onDoneTodayChange={(done) => handleDoneTodayChange(habit.id, done)}
                onStatsLoaded={(best) => handleStatsLoaded(habit.id, best)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Habit Modal */}
      {showCreateModal && (
        <CreateHabitModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateHabit}
        />
      )}
    </div>
  );
}
