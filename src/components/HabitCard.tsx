import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useHabitStats } from '@/hooks/useHabits';
import { habitsApi } from '@/lib/api/habits';
import CheckinChart from '@/components/CheckinChart';
import type { Habit, Checkin } from '@/types';

interface HabitCardProps {
  habit: Habit;
  onCheckin: () => Promise<void>;
  onDelete: () => Promise<void>;
  onEdit: () => void;
  onDoneTodayChange?: (done: boolean) => void;
  onStatsLoaded?: (stats: { bestStreak: number; currentStreak: number; completionRate: number }) => void;
}

function isTodayCheckin(dateStr: string): boolean {
  const today = new Date();
  const checkin = new Date(dateStr);
  return (
    today.getFullYear() === checkin.getFullYear() &&
    today.getMonth() === checkin.getMonth() &&
    today.getDate() === checkin.getDate()
  );
}

const DESCRIPTION_LIMIT = 80;

export default function HabitCard({ habit, onCheckin, onDelete, onEdit, onDoneTodayChange, onStatsLoaded }: HabitCardProps) {
  const { stats, loading: statsLoading, reload } = useHabitStats(habit.id);
  const [checking, setChecking] = useState(false);
  const [unchecking, setUnchecking] = useState(false);
  const [todayCheckinId, setTodayCheckinId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [doneToday, setDoneToday] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loadingCheckins, setLoadingCheckins] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    reload();
    checkIfDoneToday();
  }, [habit.id]);

  useEffect(() => {
    if (stats) {
      onStatsLoaded?.({
        bestStreak: stats.bestStreak,
        currentStreak: stats.currentStreak,
        completionRate: stats.completionRate,
      });
    }
  }, [stats]);

  async function checkIfDoneToday() {
    try {
      const data = await habitsApi.getCheckins(habit.id);
      setCheckins(data);
      const todayCheckin = data.find(c => isTodayCheckin(c.date));
      setDoneToday(!!todayCheckin);
      setTodayCheckinId(todayCheckin?.id ?? null);
      onDoneTodayChange?.(!!todayCheckin);
    } catch {
      // silently ignore
    }
  }

  async function handleCheckin() {
    if (doneToday) return;
    try {
      setChecking(true);
      await onCheckin();
      await reload();
      const data = await habitsApi.getCheckins(habit.id);
      setCheckins(data);
      const todayCheckin = data.find(c => isTodayCheckin(c.date));
      setDoneToday(!!todayCheckin);
      setTodayCheckinId(todayCheckin?.id ?? null);
      onDoneTodayChange?.(!!todayCheckin);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('already exists')) {
        // Checkin já existe — busca o ID para permitir desfazer
        try {
          const data = await habitsApi.getCheckins(habit.id);
          setCheckins(data);
          const todayCheckin = data.find(c => isTodayCheckin(c.date));
          setDoneToday(true);
          setTodayCheckinId(todayCheckin?.id ?? null);
          onDoneTodayChange?.(true);
        } catch {
          setDoneToday(true);
          onDoneTodayChange?.(true);
        }
      } else {
        alert(msg || 'Erro ao fazer check-in');
      }
    } finally {
      setChecking(false);
    }
  }

  async function handleUncheck() {
    try {
      setUnchecking(true);

      // Sempre busca checkins frescos para garantir o ID correto
      const freshData = await habitsApi.getCheckins(habit.id);
      const todayCheckin = freshData.find(c => isTodayCheckin(c.date));

      if (!todayCheckin) {
        // Nenhum checkin de hoje encontrado — apenas limpa o estado
        setDoneToday(false);
        setTodayCheckinId(null);
        onDoneTodayChange?.(false);
        return;
      }

      await habitsApi.deleteCheckin(habit.id, todayCheckin.id);
      setDoneToday(false);
      setTodayCheckinId(null);
      onDoneTodayChange?.(false);
      await reload();
      const data = await habitsApi.getCheckins(habit.id);
      setCheckins(data);
    } catch (err: any) {
      alert(err.message || 'Erro ao desfazer check-in');
    } finally {
      setUnchecking(false);
    }
  }

  async function handleDeleteConfirm() {
    try {
      setDeleting(true);
      await onDelete();
    } catch (err: any) {
      alert(err.message || 'Erro ao deletar hábito');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleToggleChart() {
    if (!showChart && checkins.length === 0) {
      setLoadingCheckins(true);
      try {
        const data = await habitsApi.getCheckins(habit.id);
        setCheckins(data);
      } catch {
        // silently ignore
      } finally {
        setLoadingCheckins(false);
      }
    }
    setShowChart(prev => !prev);
  }

  const description = habit.description ?? '';
  const descTruncated = description.length > DESCRIPTION_LIMIT && !descExpanded
    ? description.slice(0, DESCRIPTION_LIMIT) + '...'
    : description;

  const createdAt = format(new Date(habit.createdAt), "d 'de' MMM yyyy", { locale: ptBR });

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{habit.title}</h3>
          {description && (
            <p className="text-sm text-gray-600 leading-snug">
              {descTruncated}
              {description.length > DESCRIPTION_LIMIT && (
                <button
                  onClick={() => setDescExpanded(prev => !prev)}
                  className="ml-1 text-purple-600 hover:text-purple-700 text-xs font-medium"
                >
                  {descExpanded ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-purple-500 transition-colors p-1"
            title="Editar hábito"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded font-medium transition-colors"
              >
                {deleting ? '...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-500 hover:text-gray-700 px-1 py-1"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Deletar hábito"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-4">Criado em {createdAt}</p>

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
        <button
          onClick={handleUncheck}
          disabled={unchecking}
          title="Clique para desfazer o check-in de hoje"
          className="w-full group bg-green-100 hover:bg-red-50 text-green-700 hover:text-red-600 font-medium py-2.5 rounded-lg text-center mb-3 transition-colors border border-transparent hover:border-red-200"
        >
          <span className="group-hover:hidden">{unchecking ? 'Desfazendo...' : '✅ Concluído hoje!'}</span>
          <span className="hidden group-hover:inline">↩ Desfazer check-in</span>
        </button>
      ) : (
        <button
          onClick={handleCheckin}
          disabled={checking}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg transition-colors mb-3"
        >
          {checking ? 'Marcando...' : '✓ Marcar Hoje'}
        </button>
      )}

      {/* Toggle Chart */}
      <button
        onClick={handleToggleChart}
        disabled={loadingCheckins}
        className="w-full text-sm text-gray-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-1"
      >
        <svg
          className={`w-4 h-4 transition-transform ${showChart ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {loadingCheckins ? 'Carregando...' : showChart ? 'Ocultar progresso' : 'Ver progresso'}
      </button>

      {showChart && (
        <div className="mt-3">
          <CheckinChart checkins={checkins} />
        </div>
      )}
    </div>
  );
}
