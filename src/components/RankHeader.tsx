import React, { useMemo } from 'react';
import { Award } from 'lucide-react';
import { FlightLogEntry } from '@/hooks/useLogbook';

interface Props { entries: FlightLogEntry[]; userName?: string }

export default function RankHeader({ entries, userName }: Props) {
  const totalHours = useMemo(() => {
    let sum = 0;
    for (const e of entries) {
      if (e.estTimeEnroute && !isNaN(e.estTimeEnroute)) sum += Number(e.estTimeEnroute);
      else sum += 1; // fallback 1h per entry
    }
    return Math.round((sum + Number.EPSILON) * 10) / 10; // 1 decimal
  }, [entries]);

  let rank = 'Cadete';
  let bars = 1;
  if (totalHours >= 50) { rank = 'Comandante'; bars = 4; }
  else if (totalHours >= 10) { rank = 'Primeiro Oficial'; bars = 2; }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-avionics-panel px-3 py-1 rounded-md border border-avionics-border">
        <Award className="w-5 h-5 text-yellow-400" />
        <div className="text-sm">
          <div className="text-xs text-muted-foreground">{userName || 'Piloto'}</div>
          <div className="font-mono font-semibold text-foreground">{rank} • {totalHours}h</div>
        </div>
      </div>
    </div>
  );
}
