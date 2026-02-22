import { useState, useEffect } from 'react';

const ENABLED_KEY = 'habit_prefs_enabled';
const REMINDERS_KEY = 'habit_prefs_reminders';

function readJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useHabitPreferences() {
  const [enabledHabits, setEnabledHabits] = useState<Record<string, boolean>>(
    () => readJson<Record<string, boolean>>(ENABLED_KEY, {})
  );

  const [reminders, setRemindersState] = useState<Record<string, string>>(
    () => readJson<Record<string, string>>(REMINDERS_KEY, {})
  );

  useEffect(() => {
    localStorage.setItem(ENABLED_KEY, JSON.stringify(enabledHabits));
  }, [enabledHabits]);

  useEffect(() => {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  }, [reminders]);

  function isHabitEnabled(habitId: string): boolean {
    return enabledHabits[habitId] !== false;
  }

  function toggleHabit(habitId: string) {
    setEnabledHabits(prev => ({
      ...prev,
      [habitId]: prev[habitId] === false ? true : false,
    }));
  }

  function setReminder(habitId: string, time: string) {
    setRemindersState(prev => ({ ...prev, [habitId]: time }));
  }

  function removeReminder(habitId: string) {
    setRemindersState(prev => {
      const next = { ...prev };
      delete next[habitId];
      return next;
    });
  }

  return { enabledHabits, reminders, isHabitEnabled, toggleHabit, setReminder, removeReminder };
}
