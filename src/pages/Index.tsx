import { useState, useRef, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AircraftSelector from '@/components/AircraftSelector';
import WeightInput, { WeightInputRef } from '@/components/WeightInput';
import MetarDisplay, { MetarDisplayRef } from '@/components/MetarDisplay';
import RunwaySelector, { RunwaySelectorRef } from '@/components/RunwaySelector';
import SpeedCalculator, { SpeedCalculatorRef } from '@/components/SpeedCalculator';
import SimBriefImport from '@/components/SimBriefImport';
import Logbook from '@/components/Logbook';
import { Aircraft, AIRCRAFT_DB } from '@/data/aircraft';
import { MetarData } from '@/utils/metar';
import { useLogbook, FlightLogEntry } from '@/hooks/useLogbook';
import { Plane, MapPin, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Default aircraft fallback
const DEFAULT_AIRCRAFT_ID = 'B777-300ER';

export default function Index() {
  const firstAircraftId = Object.keys(AIRCRAFT_DB)[0] || DEFAULT_AIRCRAFT_ID;
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>(firstAircraftId);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(AIRCRAFT_DB[firstAircraftId] || null);
  const [weight, setWeight] = useState((selectedAircraft?.empty || 50000) + 10000);
  const [mode, setMode] = useState<'takeoff' | 'landing'>('takeoff');
  const [metar, setMetar] = useState<MetarData | null>(null);
  const [departureIcao, setDepartureIcao] = useState('');
  const [arrivalIcao, setArrivalIcao] = useState('');
  const [isSimBriefImport, setIsSimBriefImport] = useState(false);
  const [fuel, setFuel] = useState(0);
  const [cargo, setCargo] = useState(0);
  const [passengers, setPassengers] = useState(0);
  const [departureRunway, setDepartureRunway] = useState('');
  const [arrivalRunway, setArrivalRunway] = useState('');
  const [isSimBriefRunway, setIsSimBriefRunway] = useState(false);
  const [departureMetar, setDepartureMetar] = useState<MetarData | null>(null);
  const [arrivalMetar, setArrivalMetar] = useState<MetarData | null>(null);

  const weightInputRef = useRef<WeightInputRef>(null);
  const metarDisplayRef = useRef<MetarDisplayRef>(null);
  const runwaySelectorRef = useRef<RunwaySelectorRef>(null);
  const speedCalcTakeoffRef = useRef<SpeedCalculatorRef>(null);
  const speedCalcLandingRef = useRef<SpeedCalculatorRef>(null);

  const { entries, saveEntry, deleteEntry } = useLogbook();

  // GUARD CLAUSE: Ensure we always have a valid aircraft
  const currentAircraft = selectedAircraft || AIRCRAFT_DB[DEFAULT_AIRCRAFT_ID];

  const handleAircraftChange = (aircraftId: string, aircraft: Aircraft) => {
    if (!aircraft) return;
    setSelectedAircraftId(aircraftId);
    setSelectedAircraft(aircraft);
    setWeight(aircraft.empty + (aircraft.max - aircraft.empty) * 0.7);
  };

  const handleSimBriefImport = useCallback(async (data: {
    departureIcao: string;
    arrivalIcao: string;
    aircraftId: string | null;
    aircraftNotFound: boolean;
    fuel: number;
    cargo: number;
    passengers: number;
    departureRunway: string;
    arrivalRunway: string;
  }) => {
    try {
      setDepartureIcao(data.departureIcao || '');
      setArrivalIcao(data.arrivalIcao || '');
      setIsSimBriefImport(true);
      setFuel(data.fuel || 0);
      setCargo(data.cargo || 0);
      setPassengers(data.passengers || 0);
      
      // Set runways from SimBrief
      if (data.departureRunway) {
        setDepartureRunway(data.departureRunway);
        setIsSimBriefRunway(true);
      }
      if (data.arrivalRunway) {
        setArrivalRunway(data.arrivalRunway);
      }

      // SAFE AIRCRAFT HANDLING: Use fallback if not found
      if (data.aircraftId && AIRCRAFT_DB[data.aircraftId]) {
        setSelectedAircraftId(data.aircraftId);
        setSelectedAircraft(AIRCRAFT_DB[data.aircraftId]);
      } else if (data.aircraftNotFound) {
        // Keep current aircraft but show warning
        toast.warning('Aeronave não encontrada no banco de dados', {
          description: 'Selecione a aeronave manualmente',
          icon: <AlertCircle className="w-4 h-4" />,
        });
      }

      if (weightInputRef.current) {
        weightInputRef.current.setLoadData(data.fuel || 0, data.cargo || 0, data.passengers || 0);
      }

      // Auto-fill runway selector with departure runway
      setTimeout(() => {
        if (runwaySelectorRef.current && data.departureRunway) {
          runwaySelectorRef.current.setRunway(data.departureRunway);
        }
      }, 100);

      setTimeout(async () => {
        if (metarDisplayRef.current && data.departureIcao) {
          await metarDisplayRef.current.fetchForIcao(data.departureIcao);
        }
      }, 500);
    } catch (error) {
      console.error('Error processing SimBrief data:', error);
      toast.error('Erro ao processar dados do SimBrief');
    }
  }, []);

  // TAB AUTOMATION: Auto-fetch METAR when switching tabs
  useEffect(() => {
    const handleModeSwitch = async () => {
      if (mode === 'landing' && arrivalIcao && arrivalIcao.length === 4) {
        // Switching to LANDING - fetch arrival METAR
        if (metarDisplayRef.current) {
          await metarDisplayRef.current.fetchForIcao(arrivalIcao);
        }
        // Set arrival runway if available
        if (runwaySelectorRef.current && arrivalRunway) {
          runwaySelectorRef.current.setRunway(arrivalRunway);
        }
      } else if (mode === 'takeoff' && departureIcao && departureIcao.length === 4) {
        // Switching to TAKEOFF - fetch departure METAR
        if (metarDisplayRef.current) {
          await metarDisplayRef.current.fetchForIcao(departureIcao);
        }
        // Set departure runway if available
        if (runwaySelectorRef.current && departureRunway) {
          runwaySelectorRef.current.setRunway(departureRunway);
        }
      }
    };

    handleModeSwitch();
  }, [mode, arrivalIcao, departureIcao, arrivalRunway, departureRunway]);

  const handleWeightDataChange = useCallback((newFuel: number, newCargo: number, newPax: number) => {
    setFuel(newFuel);
    setCargo(newCargo);
    setPassengers(newPax);
  }, []);

  const handleSaveToLogbook = useCallback(() => {
    if (!currentAircraft) {
      toast.error('Selecione uma aeronave primeiro');
      return;
    }

    const takeoffSpeeds = speedCalcTakeoffRef.current?.getSpeeds() || { v1: 0, vr: 0, v2: 0, flapConfig: '' };
    const landingSpeeds = speedCalcLandingRef.current?.getSpeeds() || { vref: 0, vapp: 0, flapConfig: '' };

    saveEntry({
      departureIcao,
      arrivalIcao,
      aircraftId: selectedAircraftId,
      aircraftName: currentAircraft.name,
      fuel,
      cargo,
      passengers,
      totalWeight: weight,
      windSpeed: metar?.windSpeed || 0,
      windDirection: metar?.windDirection || 0,
      temperature: metar?.temperature || 15,
      metarRaw: metar?.raw || '',
      v1: takeoffSpeeds.v1 || 0,
      vr: takeoffSpeeds.vr || 0,
      v2: takeoffSpeeds.v2 || 0,
      vref: landingSpeeds.vref || 0,
      vapp: landingSpeeds.vapp || 0,
      isSimBriefImport,
      flapConfig: mode === 'takeoff' ? takeoffSpeeds.flapConfig : landingSpeeds.flapConfig,
    });

    toast.success('Voo salvo no Logbook!', {
      description: `${departureIcao || '----'} → ${arrivalIcao || '----'}`,
      icon: <CheckCircle className="w-4 h-4" />,
    });

    setIsSimBriefImport(false);
  }, [
    departureIcao, arrivalIcao, selectedAircraftId, currentAircraft,
    fuel, cargo, passengers, weight, metar, isSimBriefImport, mode, saveEntry
  ]);

  const handleLoadFromLogbook = useCallback((entry: FlightLogEntry) => {
    setDepartureIcao(entry.departureIcao);
    setArrivalIcao(entry.arrivalIcao);
    setIsSimBriefImport(entry.isSimBriefImport);

    if (AIRCRAFT_DB[entry.aircraftId]) {
      setSelectedAircraftId(entry.aircraftId);
      setSelectedAircraft(AIRCRAFT_DB[entry.aircraftId]);
    }

    if (weightInputRef.current) {
      weightInputRef.current.setLoadData(entry.fuel, entry.cargo, entry.passengers);
    }

    setFuel(entry.fuel);
    setCargo(entry.cargo);
    setPassengers(entry.passengers);

    toast.success('Voo carregado!', {
      description: `${entry.departureIcao || '----'} → ${entry.arrivalIcao || '----'}`,
    });
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plane className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">IF ULTIMATE CALC</h1>
              <p className="text-sm text-muted-foreground">Infinite Flight Speed Calculator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Logbook entries={entries} onLoad={handleLoadFromLogbook} onDelete={deleteEntry} />
            <Badge variant="secondary" className="text-sm font-mono bg-primary/20 text-primary border-primary/30 hidden sm:inline-flex">
              ALL JETS
            </Badge>
          </div>
        </div>

        {/* SimBrief Import */}
        <SimBriefImport onImport={handleSimBriefImport} />

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <Card className="p-6 bg-card border-avionics-border space-y-6">
              <AircraftSelector selectedAircraftId={selectedAircraftId} onSelect={handleAircraftChange} />
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    DEPARTURE
                  </label>
                  <Input
                    placeholder="ICAO (e.g., SBGR)"
                    value={departureIcao}
                    onChange={(e) => setDepartureIcao(e.target.value.toUpperCase())}
                    maxLength={4}
                    className="font-mono text-lg uppercase bg-card border-avionics-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    ARRIVAL
                  </label>
                  <Input
                    placeholder="ICAO (e.g., KJFK)"
                    value={arrivalIcao}
                    onChange={(e) => setArrivalIcao(e.target.value.toUpperCase())}
                    maxLength={4}
                    className="font-mono text-lg uppercase bg-card border-avionics-border"
                  />
                </div>
              </div>

              <WeightInput
                ref={weightInputRef}
                weight={weight}
                emptyWeight={currentAircraft.empty}
                maxWeight={currentAircraft.max}
                onWeightChange={setWeight}
                onDataChange={handleWeightDataChange}
              />
            </Card>

            <Card className="p-6 bg-card border-avionics-border space-y-4">
              <MetarDisplay 
                ref={metarDisplayRef}
                onMetarFetched={setMetar} 
                activeIcao={mode === 'takeoff' ? departureIcao : arrivalIcao}
                contextLabel={mode === 'takeoff' ? (departureIcao ? `${departureIcao} (Partida)` : 'Partida') : (arrivalIcao ? `${arrivalIcao} (Chegada)` : 'Chegada')}
              />
              {metar && (
                <RunwaySelector 
                  ref={runwaySelectorRef}
                  windDirection={metar.windDirection} 
                  windSpeed={metar.windSpeed}
                  suggestedRunway={mode === 'takeoff' ? departureRunway : arrivalRunway}
                  isSimBriefSuggestion={isSimBriefRunway}
                />
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div>
            <Card className="p-6 bg-card border-avionics-border h-full">
              <Tabs value={mode} onValueChange={(v) => setMode(v as 'takeoff' | 'landing')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="takeoff" className="font-mono text-base">
                    TAKEOFF
                  </TabsTrigger>
                  <TabsTrigger value="landing" className="font-mono text-base">
                    LANDING
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="takeoff">
                  <SpeedCalculator
                    ref={speedCalcTakeoffRef}
                    aircraft={currentAircraft}
                    weight={weight}
                    mode="takeoff"
                    headwind={metar?.windSpeed || 0}
                    temperature={metar?.temperature ?? 15}
                  />
                </TabsContent>

                <TabsContent value="landing">
                  <SpeedCalculator
                    ref={speedCalcLandingRef}
                    aircraft={currentAircraft}
                    weight={weight}
                    mode="landing"
                    headwind={metar?.windSpeed || 0}
                  />
                </TabsContent>
              </Tabs>

              {/* Save to Logbook Button */}
              <div className="mt-6 pt-4 border-t border-avionics-border">
                <Button 
                  onClick={handleSaveToLogbook}
                  className="w-full gap-2 h-12 text-base font-mono"
                >
                  <Save className="w-5 h-5" />
                  SALVAR NO LOGBOOK
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
