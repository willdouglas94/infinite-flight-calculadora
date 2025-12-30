import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Loader2, CheckCircle2, AlertCircle, User, LogOut, Plane } from 'lucide-react';
import { toast } from 'sonner';

// Mapping SimBrief ICAO codes to our AIRCRAFT_DB keys
const SIMBRIEF_AIRCRAFT_MAP: Record<string, string> = {
  // Airbus
  "BCS3": "A220-300",
  "A318": "A318",
  "A319": "A319",
  "A320": "A320",
  "A20N": "A320",
  "A321": "A321",
  "A21N": "A321",
  "A333": "A330-300",
  "A339": "A330-900",
  "A346": "A340-600",
  "A359": "A350-900",
  "A35K": "A350-900",
  "A388": "A380-800",
  // Boeing
  "B712": "B717",
  "B737": "B737-700",
  "B738": "B737-800",
  "B739": "B737-900",
  "B38M": "B737-MAX8",
  "B744": "B747-400",
  "B748": "B747-8",
  "B752": "B757-200",
  "B753": "B757-200",
  "B763": "B767-300",
  "B772": "B777-200ER",
  "B77L": "B777-200LR",
  "B77W": "B777-300ER",
  "B77F": "B777F",
  "B788": "B787-8",
  "B789": "B787-9",
  "B78X": "B787-10",
  // Regional
  "CRJ2": "CRJ-200",
  "CRJ7": "CRJ-700",
  "CRJ9": "CRJ-900",
  "E175": "E175",
  "E190": "E190",
  "DH8D": "Q400",
  "MD11": "MD-11",
  "DC10": "DC-10",
  // GA
  "C172": "C172",
  "C208": "C208",
  "SR22": "SR22",
  "TBM9": "TBM930",
  "CL35": "CL350",
  // Military
  "F16": "F16",
  "F18": "F18",
  "F22": "F22",
  "A10": "A10",
  "C130": "C130",
  "C17": "C17",
};

const LOCALSTORAGE_KEY = 'sb_user';

interface SimBriefImportProps {
  onImport: (data: {
    departureIcao: string;
    arrivalIcao: string;
    aircraftId: string | null;
    aircraftNotFound: boolean;
    fuel: number;
    cargo: number;
    passengers: number;
    departureRunway: string;
    arrivalRunway: string;
    stepClimb?: string | null;
    estTimeEnroute?: number | null;
  }) => void;
}

interface SimBriefWeights {
  fuel_plan_ramp?: string;
  block_fuel?: string;
  est_block_fuel?: string;
  pax_count?: string;
  cargo?: string;
  freight?: string;
}

interface SimBriefFuel {
  plan_ramp?: string;
}

interface SimBriefImages {
  fuel?: string;
}

interface SimBriefParams {
  units?: string;
}

interface SimBriefResponse {
  origin?: { icao_code?: string; plan_rwy?: string };
  destination?: { icao_code?: string; plan_rwy?: string };
  aircraft?: { icaocode?: string };
  weights?: SimBriefWeights;
  fuel?: SimBriefFuel;
  images?: SimBriefImages;
  params?: SimBriefParams;
  general?: { stepclimb_string?: string; est_time_enroute?: string | number };
}

export default function SimBriefImport({ onImport }: SimBriefImportProps) {
  const [inputUsername, setInputUsername] = useState('');
  const [simbriefUser, setSimbriefUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load saved user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(LOCALSTORAGE_KEY);
    if (savedUser) {
      setSimbriefUser(savedUser);
    }
  }, []);

  const findAircraftId = (icaoCode: string): string | null => {
    const normalizedCode = icaoCode.toUpperCase().trim();
    
    // Direct match
    if (SIMBRIEF_AIRCRAFT_MAP[normalizedCode]) {
      return SIMBRIEF_AIRCRAFT_MAP[normalizedCode];
    }
    
    // Partial match (first 3 chars)
    const partialCode = normalizedCode.slice(0, 3);
    for (const [key, value] of Object.entries(SIMBRIEF_AIRCRAFT_MAP)) {
      if (key.startsWith(partialCode)) {
        return value;
      }
    }
    
    return null;
  };

  const handleConnect = () => {
    const username = inputUsername.trim();
    if (!username) {
      toast.error('Digite seu username do SimBrief');
      return;
    }
    
    localStorage.setItem(LOCALSTORAGE_KEY, username);
    setSimbriefUser(username);
    setInputUsername('');
    toast.success('Conta SimBrief conectada!', {
      description: `Bem-vindo, ${username}`,
      icon: <CheckCircle2 className="w-4 h-4" />,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem(LOCALSTORAGE_KEY);
    setSimbriefUser(null);
    toast.info('Conta SimBrief desconectada');
  };

  const handleFetch = async () => {
    if (!simbriefUser) {
      toast.error('Conecte sua conta SimBrief primeiro');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://www.simbrief.com/api/xml.fetcher.php?username=${encodeURIComponent(simbriefUser)}&json=1`
      );

      if (!response.ok) {
        throw new Error('Erro ao conectar com SimBrief');
      }

      const data: SimBriefResponse = await response.json();

      if (!data?.origin || !data?.destination) {
        throw new Error('Plano de voo não encontrado');
      }

      // Extract data with optional chaining and safe defaults
      const departureIcao = String(data.origin?.icao_code || '').trim().toUpperCase();
      const arrivalIcao = String(data.destination?.icao_code || '').trim().toUpperCase();
      const aircraftIcao = String(data.aircraft?.icaocode || '').trim().toUpperCase();
      
      // Extract planned runways
      const departureRunway = String(data.origin?.plan_rwy || '').trim().toUpperCase();
      const arrivalRunway = String(data.destination?.plan_rwy || '').trim().toUpperCase();
      
      // Deep Search for fuel value - SimBrief API path is inconsistent
      let rampFuel = 0;
      
      // 1. Try standard "fuel" location (most common in recent API)
      if (data.fuel && data.fuel.plan_ramp) {
        rampFuel = Number(data.fuel.plan_ramp);
      }
      // 2. Try alternative "weights" location (common in older layouts)
      else if (data.weights && data.weights.est_block_fuel) {
        rampFuel = Number(data.weights.est_block_fuel);
      }
      // 3. Try fuel_plan_ramp in weights (another variation)
      else if (data.weights && data.weights.fuel_plan_ramp) {
        rampFuel = Number(data.weights.fuel_plan_ramp);
      }
      // 4. Try block_fuel in weights
      else if (data.weights && data.weights.block_fuel) {
        rampFuel = Number(data.weights.block_fuel);
      }
      // 5. Try "images" location (rare fallback)
      else if (data.images && data.images.fuel) {
        rampFuel = Number(data.images.fuel);
      }
      
      // Ensure we have a valid number
      if (isNaN(rampFuel)) rampFuel = 0;
      
      // Handle unit conversion based on SimBrief settings
      const simbriefUnits = data.params?.units || "kgs";
      // SimBrief typically returns in the user's preferred units
      // We need to convert to KG for our app
      if (simbriefUnits === "lbs") {
        rampFuel = rampFuel * 0.453592;
      }
      
      // Other weights extraction with safe parsing
      const weights = data?.weights || {};
      const cargoLbs = Number(weights?.cargo || weights?.freight || 0) || 0;
      const passengersCount = Number(weights?.pax_count || 0) || 0;

      // Validate cargo and passengers
      if (isNaN(cargoLbs) || isNaN(passengersCount)) {
        throw new Error('Dados de peso inválidos no plano');
      }

      // Convert cargo to kg (cargo is typically in lbs from SimBrief)
      const fuelKg = Math.round(rampFuel);
      const cargoKg = simbriefUnits === "lbs" 
        ? Math.round(cargoLbs * 0.453592) 
        : Math.round(cargoLbs);

      // Find aircraft match
      const aircraftId = findAircraftId(aircraftIcao);

      // Extract optional general fields safely
      const stepClimb = String(data?.general?.stepclimb_string || '').trim() || null;
      let estTimeEnroute: number | null = null;
      if (data?.general?.est_time_enroute) {
        const parsed = Number(data.general.est_time_enroute);
        if (!isNaN(parsed) && parsed > 0) estTimeEnroute = parsed;
      }

      onImport({
        departureIcao,
        arrivalIcao,
        aircraftId,
        aircraftNotFound: !aircraftId,
        fuel: fuelKg,
        cargo: cargoKg,
        passengers: passengersCount,
        departureRunway,
        arrivalRunway,
        stepClimb,
        estTimeEnroute,
      });

      if (aircraftId) {
        toast.success('Plano de Voo Carregado!', {
          description: `${departureIcao} → ${arrivalIcao}${departureRunway ? ` | RWY ${departureRunway}` : ''}`,
          icon: <CheckCircle2 className="w-4 h-4" />,
        });
      } else {
        toast.warning('Aeronave não detectada automaticamente', {
          description: 'Selecione a aeronave manualmente',
          icon: <AlertCircle className="w-4 h-4" />,
        });
      }
    } catch (error) {
      console.error('SimBrief import error:', error);
      toast.error('Erro ao importar plano de voo', {
        description: error instanceof Error ? error.message : 'Verifique o username e tente novamente',
      });
    } finally {
      setLoading(false);
    }
  };

  // Logged-in state: Show pilot dashboard
  if (simbriefUser) {
    return (
      <Card className="p-4 bg-gradient-to-r from-indigo-950/50 via-slate-900/50 to-indigo-950/50 border-indigo-500/30 shadow-lg shadow-indigo-500/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Pilot Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center border-2 border-indigo-400/50 shadow-lg">
              <User className="w-6 h-6 text-indigo-100" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                PILOTO CONECTADO
              </span>
              <span className="text-lg font-semibold text-foreground font-mono">
                {simbriefUser}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleFetch}
              disabled={loading}
              className="flex-1 sm:flex-none gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono shadow-lg shadow-indigo-600/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando plano ativo...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Importar Último Plano
                </>
              )}
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              title="Trocar Conta/Sair"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Not logged in: Show connect form
  return (
    <Card className="p-4 bg-card/50 border-avionics-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Plane className="w-4 h-4 text-primary" />
          <span>CONECTAR SIMBRIEF</span>
        </div>
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <Input
            placeholder="Seu Username SimBrief"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            className="font-mono bg-card border-avionics-border flex-1"
          />
          <Button
            onClick={handleConnect}
            disabled={!inputUsername.trim()}
            variant="secondary"
            className="whitespace-nowrap gap-2"
          >
            <User className="w-4 h-4" />
            Conectar
          </Button>
        </div>
      </div>
    </Card>
  );
}
