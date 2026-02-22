import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { subDays, isSameDay } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import type { Habit } from '@/types';

type SortKey = 'title' | 'totalCheckins' | 'currentStreak' | 'bestStreak' | 'completionRate' | 'createdAt';
type SortDir = 'asc' | 'desc';

function getBarColor(rate: number): string {
  if (rate >= 70) return '#16a34a'; // verde
  if (rate >= 40) return '#ca8a04'; // amarelo
  return '#dc2626'; // vermelho
}

export default function AnalyticsPage() {
  const { user, logout } = useAuth();
  const { habits, statsMap, checkinsMap, loading, error } = useAnalytics();
  const [sortKey, setSortKey] = useState<SortKey>('completionRate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // --- Cards de resumo global ---
  const summary = useMemo(() => {
    const statsValues = Object.values(statsMap);
    if (statsValues.length === 0) return null;

    const totalCheckins = statsValues.reduce((sum, s) => sum + s.totalCheckins, 0);
    const bestStreak = Math.max(...statsValues.map(s => s.bestStreak));
    const avgCompletionRate = statsValues.reduce((sum, s) => sum + s.completionRate, 0) / statsValues.length;

    let mostConsistentHabit: Habit | null = null;
    let maxRate = -1;
    for (const habit of habits) {
      const rate = statsMap[habit.id]?.completionRate ?? 0;
      if (rate > maxRate) {
        maxRate = rate;
        mostConsistentHabit = habit;
      }
    }

    return { totalCheckins, bestStreak, avgCompletionRate, mostConsistentHabit };
  }, [habits, statsMap]);

  // --- Atividade diária dos últimos 30 dias ---
  const dailyActivityData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const day = subDays(today, 29 - i);
      const label = format(day, 'dd/MM', { locale: ptBR });
      let count = 0;
      for (const checkins of Object.values(checkinsMap)) {
        if (checkins.some(c => isSameDay(new Date(c.date), day))) {
          count++;
        }
      }
      return { label, count };
    });
  }, [checkinsMap]);

  // --- Taxa de conclusão por hábito (ordenado do maior para o menor) ---
  const completionRateData = useMemo(() => {
    return habits
      .map(h => ({
        name: h.title.length > 18 ? h.title.slice(0, 18) + '…' : h.title,
        fullName: h.title,
        rate: Math.round(statsMap[h.id]?.completionRate ?? 0),
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [habits, statsMap]);

  // --- Streaks: atual vs melhor ---
  const streakData = useMemo(() => {
    return habits.map(h => ({
      name: h.title.length > 14 ? h.title.slice(0, 14) + '…' : h.title,
      fullName: h.title,
      currentStreak: statsMap[h.id]?.currentStreak ?? 0,
      bestStreak: statsMap[h.id]?.bestStreak ?? 0,
    }));
  }, [habits, statsMap]);

  // --- Tabela comparativa ---
  const sortedHabits = useMemo(() => {
    const list = habits.map(h => {
      const stats = statsMap[h.id];
      return {
        habit: h,
        totalCheckins: stats?.totalCheckins ?? 0,
        currentStreak: stats?.currentStreak ?? 0,
        bestStreak: stats?.bestStreak ?? 0,
        completionRate: stats?.completionRate ?? 0,
      };
    });

    list.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortKey === 'title') {
        aVal = a.habit.title.toLowerCase();
        bVal = b.habit.title.toLowerCase();
      } else if (sortKey === 'createdAt') {
        aVal = a.habit.createdAt;
        bVal = b.habit.createdAt;
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [habits, statsMap, sortKey, sortDir]);

  const bestRateHabitId = useMemo(() => {
    let maxRate = -1;
    let id = '';
    for (const h of habits) {
      const rate = statsMap[h.id]?.completionRate ?? 0;
      if (rate > maxRate) { maxRate = rate; id = h.id; }
    }
    return id;
  }, [habits, statsMap]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-purple-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando analytics...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-500">Visão geral de todos os hábitos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* 1. Cards de resumo global */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-purple-600">{summary.totalCheckins}</div>
              <div className="text-sm text-gray-600 mt-1">Total de Check-ins</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-orange-500">🔥 {summary.bestStreak}</div>
              <div className="text-sm text-gray-600 mt-1">Melhor Streak Global</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-green-600">{summary.avgCompletionRate.toFixed(0)}%</div>
              <div className="text-sm text-gray-600 mt-1">Taxa Média de Conclusão</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-base font-bold text-blue-600 truncate" title={summary.mostConsistentHabit?.title}>
                {summary.mostConsistentHabit?.title ?? '—'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Hábito Mais Consistente</div>
            </div>
          </div>
        )}

        {habits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500 text-lg mb-2">Nenhum hábito encontrado</p>
            <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium">
              Criar seu primeiro hábito →
            </Link>
          </div>
        ) : (
          <>
            {/* 2. Atividade geral — últimos 30 dias */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Atividade Geral — Últimos 30 dias</h2>
              <p className="text-sm text-gray-500 mb-4">Número de hábitos concluídos por dia</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyActivityData} barCategoryGap={4}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    interval={4}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Hábitos concluídos']}
                    labelStyle={{ fontSize: 11, color: '#374151' }}
                    contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 6 }}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} fill="#7c3aed">
                    {dailyActivityData.map((entry, i) => (
                      <Cell key={i} fill={entry.count > 0 ? '#7c3aed' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 3. Taxa de conclusão por hábito (horizontal) */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Taxa de Conclusão por Hábito</h2>
              <p className="text-sm text-gray-500 mb-4">Baseado nos últimos 30 dias — verde ≥70%, amarelo 40–70%, vermelho &lt;40%</p>
              <ResponsiveContainer width="100%" height={Math.max(180, habits.length * 36)}>
                <BarChart
                  data={completionRateData}
                  layout="vertical"
                  margin={{ left: 8, right: 32, top: 0, bottom: 0 }}
                  barCategoryGap={6}
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#374151' }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, props: { payload?: { fullName?: string } }) => [
                      `${value}%`,
                      props.payload?.fullName ?? 'Taxa de Conclusão',
                    ]}
                    labelFormatter={() => ''}
                    contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 6 }}
                  />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                    {completionRateData.map((entry, i) => (
                      <Cell key={i} fill={getBarColor(entry.rate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 4. Streaks: atual vs melhor */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Streaks: Atual vs Melhor</h2>
              <p className="text-sm text-gray-500 mb-4">Compare o streak atual com o recorde de cada hábito</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={streakData} barGap={2} barCategoryGap={12}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    labelFormatter={(_label: string, payload: Array<{ payload?: { fullName?: string } }>) =>
                      payload?.[0]?.payload?.fullName ?? _label
                    }
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'currentStreak' ? 'Streak Atual' : 'Melhor Streak',
                    ]}
                    contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 6 }}
                  />
                  <Legend
                    formatter={(value) =>
                      value === 'currentStreak' ? 'Streak Atual' : 'Melhor Streak'
                    }
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="currentStreak" fill="#7c3aed" radius={[3, 3, 0, 0]} name="currentStreak" />
                  <Bar dataKey="bestStreak" fill="#d1d5db" radius={[3, 3, 0, 0]} name="bestStreak" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 5. Tabela comparativa */}
            <div className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tabela Comparativa</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {(
                      [
                        { key: 'title', label: 'Hábito' },
                        { key: 'totalCheckins', label: 'Check-ins' },
                        { key: 'currentStreak', label: 'Streak Atual' },
                        { key: 'bestStreak', label: 'Melhor Streak' },
                        { key: 'completionRate', label: 'Taxa 30d' },
                        { key: 'createdAt', label: 'Criado em' },
                      ] as { key: SortKey; label: string }[]
                    ).map(({ key, label }) => (
                      <th
                        key={key}
                        className="text-left py-2 px-3 font-medium text-gray-600 cursor-pointer hover:text-purple-600 whitespace-nowrap select-none"
                        onClick={() => handleSort(key)}
                      >
                        {label}
                        <SortIcon col={key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedHabits.map(({ habit, totalCheckins, currentStreak, bestStreak, completionRate }) => {
                    const isTop = habit.id === bestRateHabitId;
                    return (
                      <tr
                        key={habit.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${isTop ? 'bg-purple-50' : ''}`}
                      >
                        <td className="py-2.5 px-3 font-medium text-gray-900 max-w-[160px] truncate" title={habit.title}>
                          {isTop && <span className="text-purple-600 mr-1">★</span>}
                          {habit.title}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">{totalCheckins}</td>
                        <td className="py-2.5 px-3 text-gray-700">{currentStreak}</td>
                        <td className="py-2.5 px-3 text-gray-700">{bestStreak}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className="font-semibold"
                            style={{ color: getBarColor(completionRate) }}
                          >
                            {completionRate.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                          {format(new Date(habit.createdAt), "d MMM yyyy", { locale: ptBR })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 6. Heatmap de atividade */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Heatmap de Atividade</h2>
              <p className="text-sm text-gray-500 mb-4">Últimas 12 semanas — intensidade por dia</p>
              <ActivityHeatmap checkinsMap={checkinsMap} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
