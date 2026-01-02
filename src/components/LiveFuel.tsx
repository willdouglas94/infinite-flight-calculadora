import { useState, useEffect, useCallback, useRef } from 'react';
import { Fuel, Pause, Play, Edit3, Wifi, WifiOff, Loader2, Terminal, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
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

// Alert thresholds in minutes
const FUEL_ALERT_CRITICAL = 30; // Critical: 30 min
const FUEL_ALERT_WARNING = 60; // Warning: 60 min

interface LiveFuelProps {
  initialFuel: number;
  aircraft: Aircraft | null;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type FuelAlertLevel = 'normal' | 'warning' | 'critical';

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'data';
}

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
  
  // Debug logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Fuel alert state
  const [fuelAlertLevel, setFuelAlertLevel] = useState<FuelAlertLevel>('normal');
  const [alertAcknowledged, setAlertAcknowledged] = useState(false);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastAlertLevelRef = useRef<FuelAlertLevel>('normal');

  // Add log function
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-19), { time, message, type }]); // Keep last 20 logs
  }, []);

  // Update initial fuel when prop changes
  useEffect(() => {
    if (!isEditingFuel && !isRunning && connectionStatus !== 'connected') {
      setLiveFuel(initialFuel);
      setInputValue(initialFuel.toString());
    }
  }, [initialFuel, isEditingFuel, isRunning, connectionStatus]);

  // Connect service logs to UI
  useEffect(() => {
    infiniteFlightService.onLog((message, type) => {
      addLog(message, type);
    });
  }, [addLog]);

  // IF Connect data handler
  useEffect(() => {
    infiniteFlightService.onData((data: IFData) => {
      try {
        // Update fuel from IF
        const fuelValue = data.fuelWeight ?? data.fuelTotalQuantity;
        if (fuelValue !== undefined) {
          setLiveFuel(fuelValue);
          setInputValue(Math.round(fuelValue).toString());
          addLog(`Fuel: ${Math.round(fuelValue)} kg`, 'data');
        }
        
        // Update N1
        if (data.n1 !== undefined) {
          setN1Value(data.n1);
        }
        
        // Log all received data
        const dataKeys = Object.keys(data).join(', ');
        addLog(`Dados: ${dataKeys}`, 'data');
      } catch (err) {
        addLog(`ERRO parse: ${err instanceof Error ? err.message : String(err)}`, 'error');
      }
    });

    infiniteFlightService.onStatusChange((status, message) => {
      if (status === 'connected') {
        setConnectionStatus('connected');
        setIsRunning(false);
        addLog('✓ CONECTADO ao Infinite Flight!', 'success');
        toast({
          title: "Conectado ao Infinite Flight",
          description: "Recebendo dados em tempo real",
        });
      } else if (status === 'disconnected') {
        setConnectionStatus('disconnected');
        setN1Value(null);
        addLog('✗ Desconectado', 'info');
      } else if (status === 'error') {
        setConnectionStatus('error');
        addLog(`ERRO: ${message || 'Falha desconhecida'}`, 'error');
        toast({
          title: "Erro de Conexão",
          description: message || "Falha ao conectar",
          variant: "destructive",
        });
      }
    });
  }, [toast, addLog]);

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
    try {
      if (connectionStatus === 'connected') {
        addLog('Desconectando...', 'info');
        await infiniteFlightService.disconnect();
        setConnectionStatus('disconnected');
        addLog('Desconectado com sucesso', 'info');
      } else if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        addLog('Iniciando conexão TCP...', 'info');
        addLog('Host: 127.0.0.1:10111', 'info');
        setConnectionStatus('connecting');
        
        const success = await infiniteFlightService.connect();
        
        if (!success) {
          setConnectionStatus('error');
          addLog('Falha na conexão - ver logs acima', 'error');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addLog(`EXCEÇÃO: ${errorMsg}`, 'error');
      setConnectionStatus('error');
    }
  }, [connectionStatus, addLog]);

  // Calculate time remaining
  const hoursRemaining = fuelFlow > 0 ? liveFuel / fuelFlow : 0;
  const hours = Math.floor(hoursRemaining);
  const minutes = Math.floor((hoursRemaining - hours) * 60);
  const totalMinutesRemaining = hours * 60 + minutes;

  const isConnectedToIF = connectionStatus === 'connected';

  // Fuel alert monitoring
  useEffect(() => {
    let newAlertLevel: FuelAlertLevel = 'normal';
    
    if (totalMinutesRemaining <= FUEL_ALERT_CRITICAL && totalMinutesRemaining > 0) {
      newAlertLevel = 'critical';
    } else if (totalMinutesRemaining <= FUEL_ALERT_WARNING && totalMinutesRemaining > 0) {
      newAlertLevel = 'warning';
    }
    
    // Only trigger alert if level changed to worse
    if (newAlertLevel !== lastAlertLevelRef.current) {
      if (newAlertLevel === 'critical' || (newAlertLevel === 'warning' && lastAlertLevelRef.current === 'normal')) {
        setAlertAcknowledged(false);
        
        // Play alert sound
        playAlertSound(newAlertLevel);
        
        // Log the alert
        addLog(`⚠️ ALERTA: Combustível ${newAlertLevel === 'critical' ? 'CRÍTICO' : 'BAIXO'} - ${totalMinutesRemaining} min restantes`, 
               newAlertLevel === 'critical' ? 'error' : 'info');
      }
      lastAlertLevelRef.current = newAlertLevel;
    }
    
    setFuelAlertLevel(newAlertLevel);
  }, [totalMinutesRemaining, addLog]);

  // Play alert sound function
  const playAlertSound = useCallback((level: FuelAlertLevel) => {
    try {
      // Create oscillator for alert beep
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different alert levels
      oscillator.frequency.value = level === 'critical' ? 880 : 440;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // For critical, play multiple beeps
      if (level === 'critical') {
        setTimeout(() => {
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.value = 880;
          osc2.type = 'square';
          gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          osc2.start(audioContext.currentTime);
          osc2.stop(audioContext.currentTime + 0.5);
        }, 600);
      }
    } catch (err) {
      console.log('Could not play alert sound:', err);
    }
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(() => {
    setAlertAcknowledged(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Critical Fuel Alert Banner */}
      {fuelAlertLevel !== 'normal' && !alertAcknowledged && (
        <div 
          className={`animate-pulse rounded-xl p-4 border-2 flex items-center justify-between gap-3 ${
            fuelAlertLevel === 'critical' 
              ? 'bg-red-500/20 border-red-500 text-red-400' 
              : 'bg-amber-500/20 border-amber-500 text-amber-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-8 h-8 ${fuelAlertLevel === 'critical' ? 'animate-bounce' : ''}`} />
            <div>
              <div className="font-bold text-lg uppercase tracking-wide">
                {fuelAlertLevel === 'critical' ? '⚠️ COMBUSTÍVEL CRÍTICO!' : '⚠️ COMBUSTÍVEL BAIXO'}
              </div>
              <div className="text-sm opacity-80">
                Apenas {totalMinutesRemaining} minutos de combustível restante
              </div>
            </div>
          </div>
          <button
            onClick={acknowledgeAlert}
            className={`px-4 py-2 rounded-lg font-bold text-sm uppercase ${
              fuelAlertLevel === 'critical'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-amber-500 text-black hover:bg-amber-600'
            }`}
          >
            OK
          </button>
        </div>
      )}

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

      {/* Platform Debug */}
      <div className="text-center text-xs text-muted-foreground">
        Plataforma: {typeof Capacitor !== 'undefined' ? Capacitor.getPlatform() : 'web'}
      </div>

      {/* Connection Info */}
      {connectionStatus === 'error' && (
        <div className="text-center text-xs text-muted-foreground bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p>⚠️ Erro de conexão - verifique os logs abaixo</p>
          <p className="mt-1 opacity-70">Certifique-se que o Infinite Flight está rodando com IF Connect ativo (porta 10111)</p>
        </div>
      )}

      {/* Fuel Display Card */}
      <div className={`bg-gradient-to-br border rounded-xl p-6 space-y-4 transition-all ${
        fuelAlertLevel === 'critical'
          ? 'from-red-900/30 to-red-800/10 border-red-500/50 animate-pulse'
          : fuelAlertLevel === 'warning'
          ? 'from-amber-900/30 to-amber-800/10 border-amber-500/40'
          : isConnectedToIF 
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
        
        <div className={`bg-avionics-panel border rounded-lg p-4 ${
          fuelAlertLevel === 'critical' 
            ? 'border-red-500 bg-red-500/10' 
            : fuelAlertLevel === 'warning'
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-avionics-border'
        }`}>
          <div className="text-xs text-muted-foreground font-medium mb-1">TEMPO RESTANTE</div>
          <div className={`text-2xl font-mono font-bold ${
            fuelAlertLevel === 'critical' 
              ? 'text-red-400' 
              : fuelAlertLevel === 'warning'
              ? 'text-amber-400'
              : 'text-primary'
          }`}>
            {hours}h {minutes.toString().padStart(2, '0')}m
          </div>
          {fuelAlertLevel !== 'normal' && (
            <div className={`text-[10px] mt-1 uppercase font-bold ${
              fuelAlertLevel === 'critical' ? 'text-red-400' : 'text-amber-400'
            }`}>
              {fuelAlertLevel === 'critical' ? '⚠️ CRÍTICO' : '⚠️ BAIXO'}
            </div>
          )}
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

      {/* Debug Console */}
      <div className="bg-black border border-green-500/30 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border-b border-green-500/20">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-xs font-mono font-bold text-green-400 uppercase tracking-wider">
            Debug Console
          </span>
          <span className="text-[10px] text-green-400/60 ml-auto">
            {logs.length} logs
          </span>
        </div>
        <div className="p-3 h-32 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-green-400/50 italic">
              Aguardando conexão... Clique em "Conectar ao IF" para iniciar.
            </div>
          ) : (
            logs.slice(-5).map((log, index) => (
              <div 
                key={index} 
                className={`flex gap-2 ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'data' ? 'text-cyan-400' :
                  'text-green-400/80'
                }`}
              >
                <span className="text-green-400/60 shrink-0">[{log.time}]</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
