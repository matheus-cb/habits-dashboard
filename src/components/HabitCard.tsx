import { useState, useEffect } from 'react';
import { useHabitStats } from '@/hooks/useHabits';
import { habitsApi } from '@/lib/api/habits';
import type { Habit } from '@/types';

interface HabitCardProps {
  habit: Habit;
  onCheckin: () => Promise<void>;
  onDelete: () => Promise<void>;
  onDoneTodayChange?: (done: boolean) => void;
  onStatsLoaded?: (bestStreak: number) => void;
}

function isTodayCheckin(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  const checkinDate = new Date(dateStr).toISOString().split('T')[0];
  return today === checkinDate;
}

export default function HabitCard({ habit, onCheckin, onDelete, onDoneTodayChange, onStatsLoaded }: HabitCardProps) {
  const { stats, loading: statsLoading, reload } = useHabitStats(habit.id);
  const [checking, setChecking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [doneToday, setDoneToday] = useState(false);

  useEffect(() => {
    reload();
    checkIfDoneToday();
  }, [habit.id]);

  useEffect(() => {
    if (stats) {
      onStatsLoaded?.(stats.bestStreak);
    }
  }, [stats]);

  async function checkIfDoneToday() {
    try {
      const checkins = await habitsApi.getCheckins(habit.id);
      const done = checkins.some(c => isTodayCheckin(c.date));
      setDoneToday(done);
      onDoneTodayChange?.(done);
    } catch {
      // silently ignore
    }
  }

  async function handleCheckin() {
    if (doneToday) return;
    try {
      setChecking(true);
      await onCheckin();
      setDoneToday(true);
      onDoneTodayChange?.(true);
      await reload();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('already exists')) {
        setDoneToday(true);
        onDoneTodayChange?.(true);
      } else {
        alert(msg || 'Erro ao fazer check-in');
      }
    } finally {
      setChecking(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja deletar este hábito?')) return;
    try {
      setDeleting(true);
      await onDelete();
    } catch (err: any) {
      alert(err.message || 'Erro ao deletar hábito');
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{habit.title}</h3>
          {habit.description && (
            <p className="text-sm text-gray-600">{habit.description}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-gray-400 hover:text-red-500 transition-colors ml-2"
          title="Deletar hábito"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="text-sm text-gray-400 mb-4">Carregando estatísticas...</div>
      ) : stats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-purple-600">🔥 {stats.currentStreak}</div>
            <div className="text-xs text-gray-600">Streak</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-green-600">✅ {stats.totalCheckins}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-blue-600">{stats.completionRate.toFixed(0)}%</div>
            <div className="text-xs text-gray-600">30 dias</div>
          </div>
        </div>
      )}

      {/* Check-in Button */}
      {doneToday ? (
        <div className="w-full bg-green-100 text-green-700 font-medium py-2.5 rounded-lg text-center">
          ✅ Concluído hoje!
        </div>
      ) : (
        <button
          onClick={handleCheckin}
          disabled={checking}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {checking ? 'Marcando...' : '✓ Marcar Hoje'}
        </button>
      )}
    </div>
  );
}
