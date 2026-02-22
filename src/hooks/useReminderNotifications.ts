import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import type { Habit } from '@/types';

export function useReminderNotifications(
  habits: Habit[],
  reminders: Record<string, string>
) {
  const habitsRef = useRef(habits);
  const remindersRef = useRef(reminders);

  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

  useEffect(() => {
    if (!('Notification' in window)) return;

    function check() {
      if (Notification.permission !== 'granted') return;
      const now = format(new Date(), 'HH:mm');
      for (const habit of habitsRef.current) {
        if (remindersRef.current[habit.id] === now) {
          new Notification('Hora do hábito!', {
            body: habit.title,
            icon: '/favicon.ico',
          });
        }
      }
    }

    async function start() {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      const interval = setInterval(check, 60_000);
      return () => clearInterval(interval);
    }

    let cleanup: (() => void) | undefined;
    start().then(fn => {
      cleanup = fn;
    });

    return () => {
      cleanup?.();
    };
  }, []);
}
