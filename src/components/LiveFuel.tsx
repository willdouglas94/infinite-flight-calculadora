import { useState, useEffect, useCallback } from 'react';
import { Fuel, Pause, Play, Edit3 } from 'lucide-react';
import { Aircraft } from '@/data/aircraft';

// Fuel flow estimates by aircraft type (kg/h)
const FUEL_FLOW_BY_TYPE: Record<string, number> = {
  narrow: 2500,
  heavy: 6000,
  super: 12000,
  regional: 1500,
  ga: 50,
  prop: 400,
  fighter: 3500,
  mil_transport: 4000,
  warbird: 200,
};

interface LiveFuelProps {
  initialFuel: number;
  aircraft: Aircraft | null;
}

export default function LiveFuel({ initialFuel, aircraft }: LiveFuelProps) {
  // Calculate fuel flow based on aircraft type
  const fuelFlow = aircraft ? FUEL_FLOW_BY_TYPE[aircraft.type] || 3000 : 3000;
  
  const [liveFuel, setLiveFuel] = useState(initialFuel);
  const [isEditingFuel, setIsEditingFuel] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [inputValue, setInputValue] = useState(initialFuel.toString());

  // Update initial fuel when prop changes
  useEffect(() => {
    if (!isEditingFuel && !isRunning) {
      setLiveFuel(initialFuel);
      setInputValue(initialFuel.toString());
    }
  }, [initialFuel, isEditingFuel, isRunning]);

  // Fuel countdown timer
  useEffect(() => {
    if (!isRunning || isEditingFuel || fuelFlow <= 0) return;

    const interval = setInterval(() => {
      setLiveFuel(prev => {
        const newFuel = Math.max(0, prev - (fuelFlow / 3600));
        setInputValue(Math.round(newFuel).toString());
        return newFuel;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isEditingFuel, fuelFlow]);

  const handleFocus = useCallback(() => {
    setIsEditingFuel(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditingFuel(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      setLiveFuel(parsed);
    } else {
      setInputValue(Math.round(liveFuel).toString());
    }
  }, [inputValue, liveFuel]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const toggleTimer = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  // Calculate time remaining
  const hoursRemaining = fuelFlow > 0 ? liveFuel / fuelFlow : 0;
  const hours = Math.floor(hoursRemaining);
  const minutes = Math.floor((hoursRemaining - hours) * 60);

  return (
    <div className="space-y-6">
      {/* Fuel Display Card */}
      <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border border-emerald-500/30 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              COMBUSTÍVEL ATUAL
            </span>
          </div>
          <button
            onClick={toggleTimer}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
              isRunning 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isRunning ? 'PAUSAR' : 'INICIAR'}
          </button>
        </div>

        {/* Editable Fuel Input */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative">
            <input
              type="number"
              value={inputValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="text-6xl font-black font-mono text-emerald-50 text-center bg-transparent border-none outline-none w-full 
                         focus:border-b-2 focus:border-emerald-400 transition-all
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ caretColor: '#34d399' }}
            />
            <span className="absolute -right-12 bottom-2 text-lg font-bold text-emerald-500">kg</span>
          </div>
          
          {/* Edit hint */}
          <div className="flex items-center gap-1.5 mt-2 text-emerald-400/60">
            <Edit3 className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider">
              {isEditingFuel ? 'Editando... (Enter para confirmar)' : 'Toque para Editar/Sincronizar'}
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        {isRunning && !isEditingFuel && (
          <div className="flex items-center justify-center gap-2 text-emerald-400/80">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono">
              Descontando {(fuelFlow / 3600).toFixed(2)} kg/s
            </span>
          </div>
        )}
        
        {isEditingFuel && (
          <div className="flex items-center justify-center gap-2 text-amber-400/80">
            <Pause className="w-3 h-3" />
            <span className="text-xs font-mono">Timer pausado para edição</span>
          </div>
        )}
      </div>

      {/* Fuel Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-avionics-panel border border-avionics-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium mb-1">FUEL FLOW</div>
          <div className="text-2xl font-mono font-bold text-primary">
            {fuelFlow.toLocaleString()}
            <span className="text-sm text-muted-foreground ml-1">kg/h</span>
          </div>
        </div>
        
        <div className="bg-avionics-panel border border-avionics-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium mb-1">TEMPO RESTANTE</div>
          <div className="text-2xl font-mono font-bold text-primary">
            {hours}h {minutes.toString().padStart(2, '0')}m
          </div>
        </div>
      </div>
    </div>
  );
}
