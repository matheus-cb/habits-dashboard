import { useState, useMemo } from 'react';
import { startOfWeek, addDays, subWeeks, addWeeks, format, isToday, isFuture } from 'date-fns';
import type { Habit, Checkin } from '@/types';

export type CellState = 'done' | 'missed' | 'bonus' | 'future-planned' | 'empty' | 'today-planned' | 'today-unplanned';

export interface CellInfo {
  state: CellState;
  checkinId?: string;
}

// Retorna mapa: habitId → Map<"yyyy-MM-dd", checkinId>
function buildCheckinIndex(
  checkinsMap: Record<string, Checkin[]>
): Record<string, Map<string, string>> {
  const index: Record<string, Map<string, string>> = {};
  for (const [habitId, checkins] of Object.entries(checkinsMap)) {
    index[habitId] = new Map();
    for (const checkin of checkins) {
      const key = format(new Date(checkin.date), 'yyyy-MM-dd');
      index[habitId].set(key, checkin.id);
    }
  }
  return index;
}

function getCellState(
  habit: Habit,
  day: Date,
  checkinIndex: Record<string, Map<string, string>>
): CellInfo {
  const dayOfWeek = day.getDay(); // 0=Dom ... 6=Sab
  const dateKey = format(day, 'yyyy-MM-dd');
  const isScheduled = habit.scheduledDays.includes(dayOfWeek);
  const checkinId = checkinIndex[habit.id]?.get(dateKey);
  const hasCheckin = Boolean(checkinId);
  const todayFlag = isToday(day);
  const futureFlag = isFuture(day) && !todayFlag;

  if (hasCheckin) {
    if (isScheduled) return { state: 'done', checkinId };
    return { state: 'bonus', checkinId };
  }

  if (isScheduled) {
    if (futureFlag) return { state: 'future-planned' };
    if (todayFlag) return { state: 'today-planned' };
    // past + scheduled + no checkin
    return { state: 'missed' };
  }

  // não agendado, sem check-in
  if (todayFlag) return { state: 'today-unplanned' };
  return { state: 'empty' };
}

export function useWeeklyCalendar(
  habits: Habit[],
  checkinsMap: Record<string, Checkin[]>
) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const checkinIndex = useMemo(() => buildCheckinIndex(checkinsMap), [checkinsMap]);

  // cellStateMap[habitId][dateKey] = CellInfo
  const cellStateMap = useMemo(() => {
    const map: Record<string, Record<string, CellInfo>> = {};
    for (const habit of habits) {
      map[habit.id] = {};
      for (const day of weekDays) {
        const key = format(day, 'yyyy-MM-dd');
        map[habit.id][key] = getCellState(habit, day, checkinIndex);
      }
    }
    return map;
  }, [habits, weekDays, checkinIndex]);

  // Resumo semanal
  const weeklySummary = useMemo(() => {
    let planned = 0;
    let done = 0;
    for (const habit of habits) {
      for (const day of weekDays) {
        const key = format(day, 'yyyy-MM-dd');
        const cell = cellStateMap[habit.id]?.[key];
        if (!cell) continue;
        const dayOfWeek = day.getDay();
        if (habit.scheduledDays.includes(dayOfWeek) && !isFuture(day)) {
          planned++;
          if (cell.state === 'done') done++;
        }
      }
    }
    return { planned, done };
  }, [habits, weekDays, cellStateMap]);

  function goToPrevWeek() {
    setWeekStart(prev => subWeeks(prev, 1));
  }

  function goToNextWeek() {
    setWeekStart(prev => addWeeks(prev, 1));
  }

  return {
    weekStart,
    weekDays,
    checkinIndex,
    cellStateMap,
    weeklySummary,
    goToPrevWeek,
    goToNextWeek,
  };
}
