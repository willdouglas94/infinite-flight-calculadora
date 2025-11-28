import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Weight } from 'lucide-react';

interface WeightInputProps {
  weight: number;
  emptyWeight: number;
  maxWeight: number;
  onWeightChange: (weight: number) => void;
}

export default function WeightInput({ weight, emptyWeight, maxWeight, onWeightChange }: WeightInputProps) {
  const [unit, setUnit] = useState<'KG' | 'LBS'>('KG');

  const displayWeight = unit === 'LBS' ? Math.round(weight * 2.20462) : weight;
  const displayEmpty = unit === 'LBS' ? Math.round(emptyWeight * 2.20462) : emptyWeight;
  const displayMax = unit === 'LBS' ? Math.round(maxWeight * 2.20462) : maxWeight;

  const handleWeightChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    const kgValue = unit === 'LBS' ? numValue / 2.20462 : numValue;
    onWeightChange(Math.max(emptyWeight, Math.min(maxWeight, kgValue)));
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

      <Input
        type="number"
        value={displayWeight}
        onChange={(e) => handleWeightChange(e.target.value)}
        className="text-2xl font-mono text-center bg-card border-avionics-border h-14"
        min={displayEmpty}
        max={displayMax}
      />

      <div className="space-y-2">
        <Progress value={weightRatio} className="h-2" />
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span>EMPTY: {displayEmpty.toLocaleString()}</span>
          <span className="text-primary">{weightRatio.toFixed(0)}%</span>
          <span>MAX: {displayMax.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
