import { useState, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import { Aircraft } from '@/data/aircraft';
import { calculateTakeoffSpeeds, calculateLandingSpeeds, calculateWeightRatio, safeNumber } from '@/utils/calculations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge, ArrowUp, ArrowDown, AlertTriangle, Zap } from 'lucide-react';

interface SpeedCalculatorProps {
  aircraft: Aircraft | null | undefined;
  weight: number;
  mode: 'takeoff' | 'landing';
  headwind: number;
  temperature?: number;
}

export interface SpeedCalculatorRef {
  getSpeeds: () => { v1?: number; vr?: number; v2?: number; vref?: number; vapp?: number; flapConfig: string; targetN1?: string };
}

// N1 Performance calculation based on aircraft type and weight
function calculateN1Performance(
  aircraftType: Aircraft['type'],
  weightRatio: number,
  temperature: number
): { n1: string; typeLabel: string } {
  let n1 = 0;

  switch (aircraftType) {
    case 'heavy':
    case 'super':
      // Heavy Aircraft (B777, A380): Need more initial inertia
      // Range: 88% to 98%
      n1 = 88 + (weightRatio * 10);
      break;

    case 'narrow':
    case 'regional':
      // Medium Jets (A320, B737): Standard performance
      // Range: 84% to 96%
      n1 = 84 + (weightRatio * 12);
      break;

    case 'fighter':
      // Fighters (F-22, F-18): Excess power
      // Range: 75% to 90% (To avoid unrealistic vertical takeoff without afterburner)
      n1 = 75 + (weightRatio * 15);
      break;

    case 'ga':
    case 'prop':
      // General Aviation (Cessna, TBM): Piston/turboprop engines need full power
      // Range: 95% to 100%
      n1 = 95 + (weightRatio * 5);
      break;

    case 'mil_transport':
      // Military Transport (C-130, C-17): Heavy but powerful
      // Range: 85% to 95%
      n1 = 85 + (weightRatio * 10);
      break;

    case 'warbird':
      // Warbirds (Spitfire, P-38): Vintage piston engines
      // Range: 90% to 100%
      n1 = 90 + (weightRatio * 10);
      break;

    default:
      // Safe fallback
      n1 = 90;
  }

  // TEMPERATURE CORRECTION (OAT)
  // Hot air is less dense, requires more N1
  // Add 0.15% for each degree above 15°C
  if (temperature > 15) {
    n1 += (temperature - 15) * 0.15;
  }

  // SAFETY LIMITS (CLAMP)
  // Ensure value is never absurd
  if (aircraftType === 'ga' || aircraftType === 'prop' || aircraftType === 'warbird') {
    if (n1 > 100) n1 = 100; // GA/Prop max 100%
  } else {
    if (n1 > 99) n1 = 99;   // Jets max 99% (Engine preservation)
    if (n1 < 75) n1 = 75;   // Minimum for taxi/takeoff
  }

  return {
    n1: n1.toFixed(1),
    typeLabel: aircraftType.toUpperCase()
  };
}

const SpeedCalculator = forwardRef<SpeedCalculatorRef, SpeedCalculatorProps>(
  ({ aircraft, weight, mode, headwind, temperature = 15 }, ref) => {
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

  // Calculate N1 performance for takeoff mode
  const n1Performance = mode === 'takeoff' 
    ? calculateN1Performance(aircraft.type, weightRatio, safeNumber(temperature, 15))
    : null;

  // Expose method to get current speeds for saving
  useImperativeHandle(ref, () => ({
    getSpeeds: () => ({
      ...(mode === 'takeoff' && 'v1' in speeds ? { v1: speeds.v1, vr: speeds.vr, v2: speeds.v2 } : {}),
      ...(mode === 'landing' && 'vref' in speeds ? { vref: speeds.vref, vapp: speeds.vapp } : {}),
      flapConfig: currentFlapLabel,
      targetN1: n1Performance?.n1,
    }),
  }), [speeds, mode, currentFlapLabel, n1Performance]);

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

      {/* N1 Performance Card - Takeoff Only */}
      {mode === 'takeoff' && n1Performance && parseFloat(n1Performance.n1) > 0 && (
        <div className="mt-4 p-4 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-900/20 to-orange-800/10 flex justify-between items-center shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                POTÊNCIA N1
              </span>
              {/* Aircraft Type Badge */}
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {n1Performance.typeLabel}
              </span>
            </div>
            <span className="text-[10px] text-orange-200/60">
              Ajuste para razão de 2500ft/min
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black font-mono text-orange-50 tracking-tighter drop-shadow-md">
              {n1Performance.n1}
            </span>
            <span className="text-sm font-bold text-orange-500">%</span>
          </div>
        </div>
      )}
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
