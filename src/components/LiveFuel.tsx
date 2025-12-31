import { useState, useEffect, useCallback } from 'react';
import { Fuel, Pause, Play, Edit3, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Aircraft } from '@/data/aircraft';
import { infiniteFlightService, IFData } from '@/services/InfiniteFlightService';
import { useToast } from '@/hooks/use-toast';

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

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export default function LiveFuel({ initialFuel, aircraft }: LiveFuelProps) {
  const { toast } = useToast();
  
  // Calculate fuel flow based on aircraft type
  const fuelFlow = aircraft ? FUEL_FLOW_BY_TYPE[aircraft.type] || 3000 : 3000;
  
  const [liveFuel, setLiveFuel] = useState(initialFuel);
  const [isEditingFuel, setIsEditingFuel] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [inputValue, setInputValue] = useState(initialFuel.toString());
  
  // IF Connect state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [n1Value, setN1Value] = useState<number | null>(null);

  // Update initial fuel when prop changes
  useEffect(() => {
    if (!isEditingFuel && !isRunning && connectionStatus !== 'connected') {
      setLiveFuel(initialFuel);
      setInputValue(initialFuel.toString());
    }
  }, [initialFuel, isEditingFuel, isRunning, connectionStatus]);

  // IF Connect data handler
  useEffect(() => {
    infiniteFlightService.onData((data: IFData) => {
      // Update fuel from IF
      const fuelValue = data.fuelWeight ?? data.fuelTotalQuantity;
      if (fuelValue !== undefined) {
        setLiveFuel(fuelValue);
        setInputValue(Math.round(fuelValue).toString());
      }
      
      // Update N1
      if (data.n1 !== undefined) {
        setN1Value(data.n1);
      }
    });

    infiniteFlightService.onStatusChange((status, message) => {
      if (status === 'connected') {
        setConnectionStatus('connected');
        setIsRunning(false); // Stop manual timer when connected
        toast({
          title: "Conectado ao Infinite Flight",
          description: "Recebendo dados em tempo real",
        });
      } else if (status === 'disconnected') {
        setConnectionStatus('disconnected');
        setN1Value(null);
      } else if (status === 'error') {
        setConnectionStatus('error');
        toast({
          title: "Erro de Conexão",
          description: message || "Falha ao conectar",
          variant: "destructive",
        });
      }
    });
  }, [toast]);

  // Fuel countdown timer (only when not connected to IF)
  useEffect(() => {
    if (!isRunning || isEditingFuel || fuelFlow <= 0 || connectionStatus === 'connected') return;

    const interval = setInterval(() => {
      setLiveFuel(prev => {
        const newFuel = Math.max(0, prev - (fuelFlow / 3600));
        setInputValue(Math.round(newFuel).toString());
        return newFuel;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isEditingFuel, fuelFlow, connectionStatus]);

  const handleFocus = useCallback(() => {
    if (connectionStatus !== 'connected') {
      setIsEditingFuel(true);
    }
  }, [connectionStatus]);

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
    if (connectionStatus !== 'connected') {
      setInputValue(e.target.value);
    }
  }, [connectionStatus]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const toggleTimer = useCallback(() => {
    if (connectionStatus !== 'connected') {
      setIsRunning(prev => !prev);
    }
  }, [connectionStatus]);

  const toggleIFConnect = useCallback(async () => {
    if (connectionStatus === 'connected') {
      await infiniteFlightService.disconnect();
      setConnectionStatus('disconnected');
    } else if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
      setConnectionStatus('connecting');
      const success = await infiniteFlightService.connect();
      if (!success) {
        setConnectionStatus('error');
      }
    }
  }, [connectionStatus]);

  // Calculate time remaining
  const hoursRemaining = fuelFlow > 0 ? liveFuel / fuelFlow : 0;
  const hours = Math.floor(hoursRemaining);
  const minutes = Math.floor((hoursRemaining - hours) * 60);

  const isConnectedToIF = connectionStatus === 'connected';

  return (
    <div className="space-y-6">
      {/* IF Connect Button */}
      <div className="flex justify-center">
        <button
          onClick={toggleIFConnect}
          disabled={connectionStatus === 'connecting'}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${
            connectionStatus === 'connected'
              ? 'bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30'
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 cursor-wait'
              : connectionStatus === 'error'
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30'
          }`}
        >
          {connectionStatus === 'connected' ? (
            <>
              <Wifi className="w-5 h-5" />
              <span>🟢 Conectado ao IF</span>
            </>
          ) : connectionStatus === 'connecting' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Conectando...</span>
            </>
          ) : connectionStatus === 'error' ? (
            <>
              <WifiOff className="w-5 h-5" />
              <span>🔴 Erro - Tentar Novamente</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5" />
              <span>🔴 Conectar ao IF</span>
            </>
          )}
        </button>
      </div>

      {/* Connection Info */}
      {connectionStatus === 'error' && (
        <div className="text-center text-xs text-muted-foreground bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p>⚠️ Funcionalidade disponível apenas no App Nativo Android</p>
          <p className="mt-1 opacity-70">Certifique-se que o Infinite Flight está rodando com IF Connect ativo (porta 10111)</p>
        </div>
      )}

      {/* Fuel Display Card */}
      <div className={`bg-gradient-to-br border rounded-xl p-6 space-y-4 transition-all ${
        isConnectedToIF 
          ? 'from-green-900/30 to-green-800/10 border-green-500/30' 
          : 'from-emerald-900/30 to-emerald-800/10 border-emerald-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fuel className={`w-5 h-5 ${isConnectedToIF ? 'text-green-400' : 'text-emerald-400'}`} />
            <span className={`text-xs font-bold uppercase tracking-widest ${isConnectedToIF ? 'text-green-400' : 'text-emerald-400'}`}>
              {isConnectedToIF ? 'COMBUSTÍVEL (LIVE)' : 'COMBUSTÍVEL ATUAL'}
            </span>
          </div>
          {!isConnectedToIF && (
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
          )}
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
              readOnly={isConnectedToIF}
              className={`text-6xl font-black font-mono text-center bg-transparent border-none outline-none w-full 
                         transition-all
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                         ${isConnectedToIF 
                           ? 'text-green-50 cursor-not-allowed' 
                           : 'text-emerald-50 focus:border-b-2 focus:border-emerald-400'}`}
              style={{ caretColor: isConnectedToIF ? 'transparent' : '#34d399' }}
            />
            <span className={`absolute -right-12 bottom-2 text-lg font-bold ${isConnectedToIF ? 'text-green-500' : 'text-emerald-500'}`}>kg</span>
          </div>
          
          {/* Edit hint */}
          <div className={`flex items-center gap-1.5 mt-2 ${isConnectedToIF ? 'text-green-400/60' : 'text-emerald-400/60'}`}>
            {isConnectedToIF ? (
              <>
                <Wifi className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">
                  Dados ao vivo do Infinite Flight
                </span>
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">
                  {isEditingFuel ? 'Editando... (Enter para confirmar)' : 'Toque para Editar/Sincronizar'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        {isRunning && !isEditingFuel && !isConnectedToIF && (
          <div className="flex items-center justify-center gap-2 text-emerald-400/80">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono">
              Descontando {(fuelFlow / 3600).toFixed(2)} kg/s
            </span>
          </div>
        )}
        
        {isEditingFuel && !isConnectedToIF && (
          <div className="flex items-center justify-center gap-2 text-amber-400/80">
            <Pause className="w-3 h-3" />
            <span className="text-xs font-mono">Timer pausado para edição</span>
          </div>
        )}

        {isConnectedToIF && (
          <div className="flex items-center justify-center gap-2 text-green-400/80">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-mono">Sincronizado com Infinite Flight</span>
          </div>
        )}
      </div>

      {/* Fuel Stats */}
      <div className={`grid gap-3 ${n1Value !== null ? 'grid-cols-3' : 'grid-cols-2'}`}>
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

        {n1Value !== null && (
          <div className="bg-avionics-panel border border-avionics-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">N1</div>
            <div className="text-2xl font-mono font-bold text-green-400">
              {n1Value.toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
