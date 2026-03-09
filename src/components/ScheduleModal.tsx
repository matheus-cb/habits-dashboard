import { useState } from 'react';
import { habitsApi } from '@/lib/api/habits';
import type { Habit } from '@/types';

interface ScheduleModalProps {
  habit: Habit;
  onClose: () => void;
  onSaved: () => void;
}

const DAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sab', value: 6 },
];

export default function ScheduleModal({ habit, onClose, onSaved }: ScheduleModalProps) {
  const [selected, setSelected] = useState<number[]>(habit.scheduledDays ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(day: number) {
    setSelected(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await habitsApi.update(habit.id, { scheduledDays: selected });
      onSaved();
      onClose();
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Agenda do hábito</h2>
        <p className="text-sm text-gray-500 mb-5 truncate">{habit.title}</p>

        <p className="text-xs font-medium text-gray-600 mb-3">
          Selecione os dias da semana:
        </p>

        <div className="flex gap-2 flex-wrap mb-6">
          {DAYS.map(({ label, value }) => {
            const active = selected.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggle(value)}
                className={[
                  'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                  active
                    ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
