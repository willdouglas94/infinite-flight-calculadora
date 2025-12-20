import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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

interface SimBriefImportProps {
  onImport: (data: {
    departureIcao: string;
    arrivalIcao: string;
    aircraftId: string | null;
    fuel: number;
    cargo: number;
    passengers: number;
    departureRunway: string;
    arrivalRunway: string;
  }) => void;
}

interface SimBriefWeights {
  fuel_plan_ramp?: string;
  block_fuel?: string;
  pax_count?: string;
  cargo?: string;
  freight?: string;
}

interface SimBriefResponse {
  origin?: { icao_code?: string; plan_rwy?: string };
  destination?: { icao_code?: string; plan_rwy?: string };
  aircraft?: { icaocode?: string };
  weights?: SimBriefWeights;
}

export default function SimBriefImport({ onImport }: SimBriefImportProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleFetch = async () => {
    if (!username.trim()) {
      toast.error('Digite seu username do SimBrief');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://www.simbrief.com/api/xml.fetcher.php?username=${encodeURIComponent(username.trim())}&json=1`
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
      
      // Weights - SimBrief returns in lbs, convert to kg with safe parsing
      const weights = data?.weights || {};
      const fuelLbs = Number(weights?.fuel_plan_ramp || weights?.block_fuel || 0) || 0;
      const cargoLbs = Number(weights?.cargo || weights?.freight || 0) || 0;
      const passengersCount = Number(weights?.pax_count || 0) || 0;

      // Validate numbers to prevent NaN
      if (isNaN(fuelLbs) || isNaN(cargoLbs) || isNaN(passengersCount)) {
        throw new Error('Dados de peso inválidos no plano');
      }

      // Convert lbs to kg (1 lb = 0.453592 kg)
      const fuelKg = Math.round(fuelLbs * 0.453592);
      const cargoKg = Math.round(cargoLbs * 0.453592);

      // Find aircraft match
      const aircraftId = findAircraftId(aircraftIcao);

      onImport({
        departureIcao,
        arrivalIcao,
        aircraftId,
        fuel: fuelKg,
        cargo: cargoKg,
        passengers: passengersCount,
        departureRunway,
        arrivalRunway,
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

  return (
    <Card className="p-4 bg-card/50 border-avionics-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Download className="w-4 h-4 text-primary" />
          <span>IMPORTAR DO SIMBRIEF</span>
        </div>
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <Input
            placeholder="Seu Username SimBrief"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            className="font-mono bg-card border-avionics-border flex-1"
          />
          <Button
            onClick={handleFetch}
            disabled={loading || !username.trim()}
            variant="secondary"
            className="whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              'Carregar Último Voo'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
