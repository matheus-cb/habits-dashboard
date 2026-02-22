import { useState, useEffect } from 'react';
import { habitsApi } from '@/lib/api/habits';
import type { Habit, HabitStats } from '@/types';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHabits();
  }, []);

  async function loadHabits() {
    try {
      setLoading(true);
      const data = await habitsApi.list();
      setHabits(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar hábitos');
    } finally {
      setLoading(false);
    }
  }

  async function createHabit(data: { title: string; description?: string }) {
    try {
      const newHabit = await habitsApi.create(data);
      setHabits([...habits, newHabit]);
      return newHabit;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar hábito');
      throw err;
    }
  }

  async function updateHabit(id: string, data: { title: string; description?: string }) {
    try {
      const updated = await habitsApi.update(id, data);
      setHabits(habits.map(h => h.id === id ? updated : h));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar hábito');
      throw err;
    }
  }

  async function deleteHabit(id: string) {
    try {
      await habitsApi.delete(id);
      setHabits(habits.filter(h => h.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar hábito');
      throw err;
    }
  }

  async function checkin(habitId: string) {
    try {
      await habitsApi.checkin(habitId);
      await loadHabits(); // Reload to update stats
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer check-in');
      throw err;
    }
  }

  return {
    habits,
    loading,
    error,
    loadHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    checkin,
  };
}

export function useHabitStats(habitId: string | null) {
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (habitId) {
      loadStats();
    }
  }, [habitId]);

  async function loadStats() {
    if (!habitId) return;
    try {
      setLoading(true);
      const data = await habitsApi.getStats(habitId);
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas', err);
    } finally {
      setLoading(false);
    }
  }

  return { stats, loading, reload: loadStats };
}
