import { useState, useImperativeHandle, forwardRef } from 'react';
import { Aircraft } from '@/data/aircraft';
import { calculateTakeoffSpeeds, calculateLandingSpeeds, calculateWeightRatio } from '@/utils/calculations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge, ArrowUp, ArrowDown } from 'lucide-react';

interface SpeedCalculatorProps {
  aircraft: Aircraft;
  weight: number;
  mode: 'takeoff' | 'landing';
  headwind: number;
}

export interface SpeedCalculatorRef {
  getSpeeds: () => { v1?: number; vr?: number; v2?: number; vref?: number; vapp?: number; flapConfig: string };
}

const SpeedCalculator = forwardRef<SpeedCalculatorRef, SpeedCalculatorProps>(
  ({ aircraft, weight, mode, headwind }, ref) => {
  const weightRatio = calculateWeightRatio(weight, aircraft.empty, aircraft.max);
  const [selectedFlapIndex, setSelectedFlapIndex] = useState(0);

  const availableFlaps = mode === 'takeoff' ? aircraft.to.flaps : aircraft.ldg.flaps;

  // Reset flap index if current index is out of bounds
  if (selectedFlapIndex >= availableFlaps.length) {
    setSelectedFlapIndex(0);
  }

  const speeds =
    mode === 'takeoff'
      ? calculateTakeoffSpeeds(aircraft, weightRatio, selectedFlapIndex, headwind)
      : calculateLandingSpeeds(aircraft, weightRatio, selectedFlapIndex, headwind);

  const currentFlapLabel = availableFlaps[selectedFlapIndex]?.l || '';

  // Expose method to get current speeds for saving
  useImperativeHandle(ref, () => ({
    getSpeeds: () => ({
      ...(mode === 'takeoff' && 'v1' in speeds ? { v1: speeds.v1, vr: speeds.vr, v2: speeds.v2 } : {}),
      ...(mode === 'landing' && 'vref' in speeds ? { vref: speeds.vref, vapp: speeds.vapp } : {}),
      flapConfig: currentFlapLabel,
    }),
  }), [speeds, mode, currentFlapLabel]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          FLAP CONFIGURATION
        </label>
        <Select
          value={selectedFlapIndex.toString()}
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
            <SpeedCard label="V1" value={speeds.v1} color="text-warning" icon={<ArrowUp className="w-5 h-5" />} />
            <SpeedCard label="VR" value={speeds.vr} color="text-primary" icon={<ArrowUp className="w-5 h-5" />} />
            <SpeedCard label="V2" value={speeds.v2} color="text-success" icon={<ArrowUp className="w-5 h-5" />} />
          </>
        )}

        {mode === 'landing' && 'vref' in speeds && (
          <>
            <SpeedCard label="VREF" value={speeds.vref} color="text-primary" icon={<ArrowDown className="w-5 h-5" />} />
            <SpeedCard label="VAPP" value={speeds.vapp} color="text-success" icon={<ArrowDown className="w-5 h-5" />} />
          </>
        )}
      </div>
    </div>
  );
});

SpeedCalculator.displayName = 'SpeedCalculator';

export default SpeedCalculator;

function SpeedCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-avionics-panel border border-avionics-border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={color}>{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground font-medium">{label}</div>
          <div className={`text-4xl font-mono font-bold ${color}`}>{value}</div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground font-mono">KIAS</div>
    </div>
  );
}
