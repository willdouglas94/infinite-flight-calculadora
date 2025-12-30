import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  windDir: number | null | undefined;
  windSpeed: number | null | undefined;
  rwyHdg: number | null | undefined; // degrees
}

export default function CrosswindVisualizer({ windDir, windSpeed, rwyHdg }: Props) {
  if (windDir == null || windSpeed == null || rwyHdg == null) {
    return null;
  }

  const toRad = (d: number) => (d * Math.PI) / 180;
  const delta = (((windDir - rwyHdg) % 360) + 540) % 360 - 180; // -180..180 difference
  const crosswind = Math.abs(Math.sin(toRad(delta)) * windSpeed);
  const headwind = Math.cos(toRad(delta)) * windSpeed;
  const arrowColor = crosswind > 20 ? '#ff4d4f' : '#60a5fa';

  // Rotate arrow so it represents wind relative to runway (0 = aligned with runway)
  const rotateDeg = delta; // arrow points from wind onto runway

  return (
    <div className="flex items-center gap-3 mt-3">
      <div className="w-12 h-36 bg-slate-700/60 rounded-md flex items-center justify-center border border-slate-600">
        {/* Runway rectangle */}
        <div className="w-6 h-28 bg-slate-500 rounded-sm" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3">
          <svg width="120" height="60" viewBox="0 0 120 60" className="overflow-visible">
            <g transform={`translate(20,30)`}> 
              <rect x="-6" y="-20" width="12" height="40" fill="#9ca3af" rx="1" />
              <g transform={`rotate(${rotateDeg})`}>
                <line x1="20" y1="0" x2="60" y2="0" stroke={arrowColor} strokeWidth="3" strokeLinecap="round" />
                <polygon points="60,0 52,-6 52,6" fill={arrowColor} />
              </g>
            </g>
          </svg>

          <div className="text-sm">
            <div className="font-mono text-xs text-muted-foreground">Vento: {windDir}° @ {windSpeed} kt</div>
            <div className="font-mono text-sm">Crosswind: <span className="font-bold">{Math.round(crosswind)} kt</span></div>
            <div className="text-xs text-muted-foreground">Head/Tail: {Math.round(headwind)} kt</div>
          </div>
        </div>
        {crosswind > 20 && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="font-semibold">Alerta: Vento de través crítico ({Math.round(crosswind)} kt)</span>
          </div>
        )}
      </div>
    </div>
  );
}
