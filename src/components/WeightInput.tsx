import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Weight, Fuel } from 'lucide-react';

interface WeightInputProps {
  weight: number;
  emptyWeight: number;
  maxWeight: number;
  onWeightChange: (weight: number) => void;
}

export default function WeightInput({ weight, emptyWeight, maxWeight, onWeightChange }: WeightInputProps) {
  const [unit, setUnit] = useState<'KG' | 'LBS'>('KG');
  const [mode, setMode] = useState<'direct' | 'fuel'>('direct');
  const [fuelRemaining, setFuelRemaining] = useState(0);
  const [payloadPercent, setPayloadPercent] = useState(50);

  const displayWeight = unit === 'LBS' ? Math.round(weight * 2.20462) : weight;
  const displayEmpty = unit === 'LBS' ? Math.round(emptyWeight * 2.20462) : emptyWeight;
  const displayMax = unit === 'LBS' ? Math.round(maxWeight * 2.20462) : maxWeight;

  const isOverweight = weight > maxWeight;
  const isUnderweight = weight < emptyWeight;
  const hasWeightWarning = isOverweight || isUnderweight;

  const handleDirectWeightChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    const kgValue = unit === 'LBS' ? numValue / 2.20462 : numValue;
    onWeightChange(kgValue);
  };

  const handleFuelChange = (value: string) => {
    const fuel = parseFloat(value) || 0;
    const fuelKg = unit === 'LBS' ? fuel / 2.20462 : fuel;
    setFuelRemaining(fuelKg);
    calculateWeightFromFuel(fuelKg, payloadPercent);
  };

  const handlePayloadChange = (value: number[]) => {
    setPayloadPercent(value[0]);
    calculateWeightFromFuel(fuelRemaining, value[0]);
  };

  const calculateWeightFromFuel = (fuel: number, payload: number) => {
    const maxPayload = (maxWeight - emptyWeight) * 0.6; // Assuming 60% can be payload
    const payloadWeight = (payload / 100) * maxPayload;
    const totalWeight = emptyWeight + fuel + payloadWeight;
    onWeightChange(totalWeight);
  };

  const weightRatio = ((weight - emptyWeight) / (maxWeight - emptyWeight)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Weight className="w-4 h-4 text-primary" />
          WEIGHT
        </label>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={unit === 'KG' ? 'default' : 'secondary'}
            onClick={() => setUnit('KG')}
            className="h-7 px-3 text-xs font-mono"
          >
            KG
          </Button>
          <Button
            size="sm"
            variant={unit === 'LBS' ? 'default' : 'secondary'}
            onClick={() => setUnit('LBS')}
            className="h-7 px-3 text-xs font-mono"
          >
            LBS
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <Button
          size="sm"
          variant={mode === 'direct' ? 'default' : 'outline'}
          onClick={() => setMode('direct')}
          className="flex-1 h-8 text-xs"
        >
          <Weight className="w-3 h-3 mr-1" />
          Direto
        </Button>
        <Button
          size="sm"
          variant={mode === 'fuel' ? 'default' : 'outline'}
          onClick={() => setMode('fuel')}
          className="flex-1 h-8 text-xs"
        >
          <Fuel className="w-3 h-3 mr-1" />
          Por Combustível
        </Button>
      </div>

      {mode === 'direct' ? (
        <div className="space-y-2">
          <Input
            type="number"
            value={displayWeight}
            onChange={(e) => handleDirectWeightChange(e.target.value)}
            className={`text-2xl font-mono text-center bg-card h-14 ${
              hasWeightWarning 
                ? 'border-red-500 border-2 ring-2 ring-red-500/20' 
                : 'border-border'
            }`}
          />
          {hasWeightWarning && (
            <p className="text-xs font-mono text-red-500 text-center">
              {isOverweight ? '⚠️ OVERWEIGHT' : '⚠️ UNDERWEIGHT'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Fuel className="w-3 h-3" />
              COMBUSTÍVEL RESTANTE
            </label>
            <Input
              type="number"
              value={unit === 'LBS' ? Math.round(fuelRemaining * 2.20462) : Math.round(fuelRemaining)}
              onChange={(e) => handleFuelChange(e.target.value)}
              className="text-lg font-mono text-center bg-card border-border h-12"
              placeholder="0"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              CARGA/PASSAGEIROS: {payloadPercent}%
            </label>
            <Slider
              value={[payloadPercent]}
              onValueChange={handlePayloadChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="p-3 bg-card/50 border border-border rounded-md">
            <p className="text-xs text-muted-foreground text-center mb-1">PESO CALCULADO</p>
            <p className={`text-xl font-mono text-center ${
              hasWeightWarning ? 'text-red-500' : 'text-foreground'
            }`}>
              {displayWeight.toLocaleString()} {unit}
            </p>
            {hasWeightWarning && (
              <p className="text-xs font-mono text-red-500 text-center mt-1">
                {isOverweight ? '⚠️ OVERWEIGHT' : '⚠️ UNDERWEIGHT'}
              </p>
            )}
          </div>
        </div>
      )}

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
}
