import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subDays, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Checkin } from '@/types';

interface CheckinChartProps {
  checkins: Checkin[];
}

interface DayData {
  label: string;
  completed: number;
}

export default function CheckinChart({ checkins }: CheckinChartProps) {
  const data = useMemo<DayData[]>(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const day = subDays(today, 29 - i);
      const label = format(day, 'dd/MM', { locale: ptBR });
      const completed = checkins.some(c => isSameDay(new Date(c.date), day)) ? 1 : 0;
      return { label, completed };
    });
  }, [checkins]);

  const completedDays = data.filter(d => d.completed).length;

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">
        Últimos 30 dias — <span className="font-medium text-purple-600">{completedDays} dias concluídos</span>
      </p>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} barCategoryGap={2} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: '#9ca3af' }}
            interval={4}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 1]} />
          <Tooltip
            formatter={(value: number) => [value === 1 ? 'Concluído' : 'Não concluído', '']}
            labelStyle={{ fontSize: 11, color: '#374151' }}
            contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 6 }}
          />
          <Bar dataKey="completed" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.completed ? '#7c3aed' : '#e5e7eb'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
