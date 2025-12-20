import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Aircraft } from '@/data/aircraft';
import { calculateTakeoffSpeeds, calculateLandingSpeeds, calculateWeightRatio, safeNumber } from '@/utils/calculations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';

interface SpeedCalculatorProps {
  aircraft: Aircraft | null | undefined;
  weight: number;
  mode: 'takeoff' | 'landing';
  headwind: number;
}

export interface SpeedCalculatorRef {
  getSpeeds: () => { v1?: number; vr?: number; v2?: number; vref?: number; vapp?: number; flapConfig: string };
}

const SpeedCalculator = forwardRef<SpeedCalculatorRef, SpeedCalculatorProps>(
  ({ aircraft, weight, mode, headwind }, ref) => {
  const [selectedFlapIndex, setSelectedFlapIndex] = useState(0);

  // GUARD CLAUSE: Protect against missing aircraft
  if (!aircraft || !aircraft.to || !aircraft.ldg) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
        <AlertTriangle className="w-10 h-10 text-warning" />
        <p className="text-muted-foreground">Selecione uma aeronave para ver os cálculos</p>
      </div>
    );
  }

  const safeWeight = safeNumber(weight, aircraft.empty);
  const safeHeadwind = safeNumber(headwind, 0);
  const weightRatio = calculateWeightRatio(safeWeight, aircraft.empty, aircraft.max);

  const availableFlaps = mode === 'takeoff' ? aircraft.to.flaps : aircraft.ldg.flaps;

  // Protect against empty flaps array
  if (!availableFlaps || availableFlaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
        <AlertTriangle className="w-10 h-10 text-warning" />
        <p className="text-muted-foreground">Configuração de flaps não disponível</p>
      </div>
    );
  }

  // Safe flap index
  const safeFlap = selectedFlapIndex >= availableFlaps.length ? 0 : selectedFlapIndex;

  const speeds =
    mode === 'takeoff'
      ? calculateTakeoffSpeeds(aircraft, weightRatio, safeFlap, safeHeadwind)
      : calculateLandingSpeeds(aircraft, weightRatio, safeFlap, safeHeadwind);

  const currentFlapLabel = availableFlaps[safeFlap]?.l || 'Default';

  // Expose method to get current speeds for saving
  useImperativeHandle(ref, () => ({
    getSpeeds: () => ({
      ...(mode === 'takeoff' && 'v1' in speeds ? { v1: speeds.v1, vr: speeds.vr, v2: speeds.v2 } : {}),
      ...(mode === 'landing' && 'vref' in speeds ? { vref: speeds.vref, vapp: speeds.vapp } : {}),
      flapConfig: currentFlapLabel,
    }),
  }), [speeds, mode, currentFlapLabel]);

  // Reset flap index when aircraft changes and current index is invalid
  useEffect(() => {
    if (selectedFlapIndex >= availableFlaps.length) {
      setSelectedFlapIndex(0);
    }
  }, [aircraft, mode, availableFlaps.length, selectedFlapIndex]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          FLAP CONFIGURATION
        </label>
        <Select
          value={safeFlap.toString()}
          onValueChange={(value) => setSelectedFlapIndex(parseInt(value))}
        >
          <SelectTrigger className="bg-card border-avionics-border text-lg font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-avionics-border z-50">
            {availableFlaps.map((flap, index) => (
              <SelectItem key={index} value={index.toString()} className="font-mono">
                {flap.l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {mode === 'takeoff' && 'v1' in speeds && (
          <>
            <SpeedCard label="V1" value={safeNumber(speeds.v1)} color="text-warning" icon={<ArrowUp className="w-5 h-5" />} />
            <SpeedCard label="VR" value={safeNumber(speeds.vr)} color="text-primary" icon={<ArrowUp className="w-5 h-5" />} />
            <SpeedCard label="V2" value={safeNumber(speeds.v2)} color="text-success" icon={<ArrowUp className="w-5 h-5" />} />
          </>
        )}

        {mode === 'landing' && 'vref' in speeds && (
          <>
            <SpeedCard label="VREF" value={safeNumber(speeds.vref)} color="text-primary" icon={<ArrowDown className="w-5 h-5" />} />
            <SpeedCard label="VAPP" value={safeNumber(speeds.vapp)} color="text-success" icon={<ArrowDown className="w-5 h-5" />} />
          </>
        )}
      </div>
    </div>
  );
});

SpeedCalculator.displayName = 'SpeedCalculator';

export default SpeedCalculator;

function SpeedCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  const displayValue = isNaN(value) || !isFinite(value) ? '---' : value;
  
  return (
    <div className="bg-avionics-panel border border-avionics-border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={color}>{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground font-medium">{label}</div>
          <div className={`text-4xl font-mono font-bold ${color}`}>{displayValue}</div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground font-mono">KIAS</div>
    </div>
  );
}
