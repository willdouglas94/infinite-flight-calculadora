import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Weight, Package, Users, Fuel } from 'lucide-react';

interface WeightInputProps {
  weight: number;
  emptyWeight: number;
  maxWeight: number;
  onWeightChange: (weight: number) => void;
  onDataChange?: (fuel: number, cargo: number, passengers: number) => void;
}

export interface WeightInputRef {
  setLoadData: (fuel: number, cargo: number, passengers: number) => void;
}

const WeightInput = forwardRef<WeightInputRef, WeightInputProps>(
  ({ weight, emptyWeight, maxWeight, onWeightChange, onDataChange }, ref) => {
  const [unit, setUnit] = useState<'KG' | 'LBS'>('KG');
  const [fuel, setFuel] = useState(0);
  const [cargo, setCargo] = useState(0);
  const [passengers, setPassengers] = useState(0);

  // Expose method to set load data from parent
  useImperativeHandle(ref, () => ({
    setLoadData: (newFuel: number, newCargo: number, newPassengers: number) => {
      setFuel(newFuel);
      setCargo(newCargo);
      setPassengers(newPassengers);
    },
  }));

  // Calculate total weight automatically
  useEffect(() => {
    const PASSENGER_WEIGHT = 90; // kg (average with luggage)
    const totalWeight = emptyWeight + fuel + cargo + (passengers * PASSENGER_WEIGHT);
    onWeightChange(totalWeight);
    onDataChange?.(fuel, cargo, passengers);
  }, [fuel, cargo, passengers, emptyWeight, onWeightChange, onDataChange]);

  const displayWeight = unit === 'LBS' ? Math.round(weight * 2.20462) : weight;
  const displayEmpty = unit === 'LBS' ? Math.round(emptyWeight * 2.20462) : emptyWeight;
  const displayMax = unit === 'LBS' ? Math.round(maxWeight * 2.20462) : maxWeight;

  const isOverweight = weight > maxWeight;
  const isUnderweight = weight < emptyWeight;
  const hasWeightWarning = isOverweight || isUnderweight;

  const handleInputChange = (value: string, setter: (val: number) => void) => {
    const numValue = parseFloat(value) || 0;
    const kgValue = unit === 'LBS' ? numValue / 2.20462 : numValue;
    setter(kgValue);
  };

  const weightRatio = ((weight - emptyWeight) / (maxWeight - emptyWeight)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Weight className="w-4 h-4 text-primary" />
          PLANEJAMENTO DE CARGA
        </label>
        <div className="flex gap-1">
          <button
            onClick={() => setUnit('KG')}
            className={`h-7 px-3 text-xs font-mono rounded transition-colors ${
              unit === 'KG' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            KG
          </button>
          <button
            onClick={() => setUnit('LBS')}
            className={`h-7 px-3 text-xs font-mono rounded transition-colors ${
              unit === 'LBS' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            LBS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Fuel className="w-3 h-3" />
            COMBUSTÍVEL
          </label>
          <Input
            type="number"
            value={unit === 'LBS' ? Math.round(fuel * 2.20462) : Math.round(fuel)}
            onChange={(e) => handleInputChange(e.target.value, setFuel)}
            className="text-lg font-mono text-center bg-card border-border h-12"
            placeholder="0"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Package className="w-3 h-3" />
            CARGA
          </label>
          <Input
            type="number"
            value={unit === 'LBS' ? Math.round(cargo * 2.20462) : Math.round(cargo)}
            onChange={(e) => handleInputChange(e.target.value, setCargo)}
            className="text-lg font-mono text-center bg-card border-border h-12"
            placeholder="0"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            PASSAGEIROS
          </label>
          <Input
            type="number"
            value={passengers}
            onChange={(e) => setPassengers(parseInt(e.target.value) || 0)}
            className="text-lg font-mono text-center bg-card border-border h-12"
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <div className={`p-4 rounded-md border-2 ${
        hasWeightWarning 
          ? 'bg-red-500/10 border-red-500' 
          : 'bg-primary/10 border-primary/30'
      }`}>
        <p className="text-xs text-muted-foreground text-center mb-1">PESO TOTAL</p>
        <p className={`text-3xl font-mono text-center font-bold ${
          hasWeightWarning ? 'text-red-500' : 'text-primary'
        }`}>
          {displayWeight.toLocaleString()} {unit}
        </p>
        {hasWeightWarning && (
          <p className="text-xs font-mono text-red-500 text-center mt-2">
            {isOverweight ? '⚠️ OVERWEIGHT' : '⚠️ UNDERWEIGHT'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Progress 
          value={Math.min(100, Math.max(0, weightRatio))} 
          className={`h-2 ${isOverweight ? '[&>div]:bg-red-500' : ''}`}
        />
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span>EMPTY: {displayEmpty.toLocaleString()}</span>
          <span className={isOverweight ? 'text-red-500' : 'text-primary'}>
            {weightRatio.toFixed(0)}%
          </span>
          <span>MAX: {displayMax.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
});

WeightInput.displayName = 'WeightInput';

export default WeightInput;
