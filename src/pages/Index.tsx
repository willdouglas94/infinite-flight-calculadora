import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AircraftSelector from '@/components/AircraftSelector';
import WeightInput from '@/components/WeightInput';
import MetarDisplay from '@/components/MetarDisplay';
import RunwaySelector from '@/components/RunwaySelector';
import SpeedCalculator from '@/components/SpeedCalculator';
import { Aircraft, AIRCRAFT_DB } from '@/data/aircraft';
import { MetarData } from '@/utils/metar';
import { Plane, MapPin } from 'lucide-react';

export default function Index() {
  const firstAircraftId = Object.keys(AIRCRAFT_DB)[0];
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>(firstAircraftId);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft>(AIRCRAFT_DB[firstAircraftId]);
  const [weight, setWeight] = useState(selectedAircraft.empty + 10000);
  const [mode, setMode] = useState<'takeoff' | 'landing'>('takeoff');
  const [metar, setMetar] = useState<MetarData | null>(null);
  const [departureIcao, setDepartureIcao] = useState('');
  const [arrivalIcao, setArrivalIcao] = useState('');

  const handleAircraftChange = (aircraftId: string, aircraft: Aircraft) => {
    setSelectedAircraftId(aircraftId);
    setSelectedAircraft(aircraft);
    // Reset weight to a reasonable value when aircraft changes
    setWeight(aircraft.empty + (aircraft.max - aircraft.empty) * 0.7);
  };

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
          <Badge variant="secondary" className="text-sm font-mono bg-primary/20 text-primary border-primary/30">
            ALL JETS
          </Badge>
        </div>

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
                weight={weight}
                emptyWeight={selectedAircraft.empty}
                maxWeight={selectedAircraft.max}
                onWeightChange={setWeight}
              />
            </Card>

            <Card className="p-6 bg-card border-avionics-border space-y-4">
              <MetarDisplay onMetarFetched={setMetar} />
              {metar && (
                <RunwaySelector windDirection={metar.windDirection} windSpeed={metar.windSpeed} />
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
                    aircraft={selectedAircraft}
                    weight={weight}
                    mode="takeoff"
                    headwind={metar?.windSpeed || 0}
                  />
                </TabsContent>

                <TabsContent value="landing">
                  <SpeedCalculator
                    aircraft={selectedAircraft}
                    weight={weight}
                    mode="landing"
                    headwind={metar?.windSpeed || 0}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
