import { useMemo, useState } from 'react';
import { subDays, format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Checkin } from '@/types';

interface ActivityHeatmapProps {
  checkinsMap: Record<string, Checkin[]>;
}

interface DayCell {
  date: Date;
  count: number;
  label: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  date: string;
  count: number;
}

function getCellColor(count: number): string {
  if (count === 0) return 'bg-gray-100';
  if (count === 1) return 'bg-purple-200';
  if (count === 2) return 'bg-purple-400';
  return 'bg-purple-700';
}

const WEEKS = 12;

export default function ActivityHeatmap({ checkinsMap }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, date: '', count: 0,
  });

  const { cells, weekLabels } = useMemo(() => {
    const today = new Date();
    const startDay = startOfWeek(subDays(today, WEEKS * 7 - 1), { weekStartsOn: 0 });

    // Flatten all checkins into a map: dateString → count
    const countByDate: Record<string, number> = {};
    for (const checkins of Object.values(checkinsMap)) {
      for (const checkin of checkins) {
        const key = new Date(checkin.date).toISOString().split('T')[0];
        countByDate[key] = (countByDate[key] ?? 0) + 1;
      }
    }

    const totalDays = WEEKS * 7;
    const allCells: DayCell[] = [];

    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startDay, i);
      const key = date.toISOString().split('T')[0];
      const count = countByDate[key] ?? 0;
      allCells.push({
        date,
        count,
        label: format(date, "d 'de' MMM yyyy", { locale: ptBR }),
      });
    }

    // Group into weeks (columns of 7 days)
    const weeks: DayCell[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      weeks.push(allCells.slice(w * 7, w * 7 + 7));
    }

    // Labels for months at column level
    const labels: string[] = weeks.map((week) => {
      const firstDay = week[0].date;
      return format(firstDay, 'MMM', { locale: ptBR });
    });

    return { cells: weeks, weekLabels: labels };
  }, [checkinsMap]);

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>, cell: DayCell) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      date: cell.label,
      count: cell.count,
    });
  }

  function handleMouseLeave() {
    setTooltip(prev => ({ ...prev, visible: false }));
  }

  return (
    <div className="relative">
      {/* Fixed tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.date}: {tooltip.count === 0 ? 'Nenhum hábito' : `${tooltip.count} hábito${tooltip.count > 1 ? 's' : ''}`}
        </div>
      )}

      <div className="flex gap-1">
        {/* Day labels column */}
        <div className="flex flex-col gap-1 pt-5">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-3 w-6 text-[9px] text-gray-400 leading-3 text-right pr-1">
              {i % 2 === 1 ? label : ''}
            </div>
          ))}
        </div>

        {/* Weeks columns */}
        <div className="flex flex-col gap-1 overflow-hidden flex-1">
          {/* Month labels */}
          <div className="flex gap-1">
            {cells.map((_, wi) => (
              <div key={wi} className="flex-1 text-[9px] text-gray-400 text-center truncate">
                {weekLabels[wi] !== weekLabels[wi - 1] ? weekLabels[wi] : ''}
              </div>
            ))}
          </div>

          {/* Grid: rows = days of week, columns = weeks */}
          {Array.from({ length: 7 }).map((_, dayIdx) => (
            <div key={dayIdx} className="flex gap-1">
              {cells.map((week, wi) => {
                const cell = week[dayIdx];
                if (!cell) return <div key={wi} className="flex-1 h-3" />;
                return (
                  <div
                    key={wi}
                    className={`flex-1 h-3 rounded-sm cursor-default transition-opacity hover:opacity-80 ${getCellColor(cell.count)}`}
                    onMouseEnter={(e) => handleMouseEnter(e, cell)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs text-gray-400">Menos</span>
        {[0, 1, 2, 3].map((level) => (
          <div
            key={level}
            className={`w-3 h-3 rounded-sm ${getCellColor(level)}`}
          />
        ))}
        <span className="text-xs text-gray-400">Mais</span>
      </div>
    </div>
  );
}
