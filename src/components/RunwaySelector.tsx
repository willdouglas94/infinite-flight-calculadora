import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { calculateWindComponents } from '@/utils/calculations';
import { Navigation, Wind } from 'lucide-react';

interface RunwaySelectorProps {
  windDirection: number;
  windSpeed: number;
}

interface RunwayAnalysis {
  runway: string;
  heading: number;
  headwind: number;
  crosswind: number;
}

export default function RunwaySelector({ windDirection, windSpeed }: RunwaySelectorProps) {
  const [runwaysInput, setRunwaysInput] = useState('');

  const parseRunways = (): RunwayAnalysis[] => {
    const runways = runwaysInput
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    return runways.map((runway) => {
      // Extract runway number (e.g., "09L" -> 09, "27R" -> 27)
      const match = runway.match(/(\d{2})/);
      const runwayNumber = match ? parseInt(match[1]) : 0;
      const heading = runwayNumber * 10;

      const { headwind, crosswind } = calculateWindComponents(windDirection, windSpeed, heading);

      return { runway, heading, headwind, crosswind };
    });
  };

  const analyses = windSpeed > 0 ? parseRunways() : [];
  const bestRunway = analyses.length > 0 
    ? analyses.reduce((best, current) => (current.headwind > best.headwind ? current : best))
    : null;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Navigation className="w-4 h-4 text-primary" />
        RUNWAY ANALYSIS
      </label>

      <Input
        placeholder="e.g., 09L, 27R, 15"
        value={runwaysInput}
        onChange={(e) => setRunwaysInput(e.target.value.toUpperCase())}
        className="font-mono text-lg uppercase bg-card border-avionics-border"
      />

      {analyses.length > 0 && (
        <div className="space-y-2">
          {analyses.map((analysis) => (
            <div
              key={analysis.runway}
              className={`p-3 rounded border ${
                analysis.runway === bestRunway?.runway
                  ? 'bg-success/10 border-success'
                  : 'bg-card/50 border-avionics-border'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-mono font-bold text-foreground">
                    RWY {analysis.runway}
                  </span>
                  {analysis.runway === bestRunway?.runway && (
                    <span className="text-xs font-semibold text-success">BEST</span>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <Wind className="inline w-3 h-3 mr-1 text-primary" />
                    <span className="font-mono">
                      <span className="text-success font-bold">{Math.abs(analysis.headwind)}</span>
                      <span className="text-muted-foreground text-xs"> KT {analysis.headwind >= 0 ? 'HEAD' : 'TAIL'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="font-mono">
                      <span className="text-warning font-bold">{Math.abs(analysis.crosswind)}</span>
                      <span className="text-muted-foreground text-xs"> KT CROSS</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
