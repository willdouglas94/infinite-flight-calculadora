import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import AircraftSelector from '@/components/AircraftSelector';
import WeightInput, { WeightInputRef } from '@/components/WeightInput';
import MetarDisplay, { MetarDisplayRef } from '@/components/MetarDisplay';
import RunwaySelector, { RunwaySelectorRef } from '@/components/RunwaySelector';
import SpeedCalculator, { SpeedCalculatorRef } from '@/components/SpeedCalculator';
import SimBriefImport from '@/components/SimBriefImport';
import Logbook from '@/components/Logbook';
import LiveFuel from '@/components/LiveFuel';
import CrosswindVisualizer from '@/components/CrosswindVisualizer';
import TodCalculator from '@/components/TodCalculator';
import ChecklistComponent from '@/components/ChecklistComponent';
import StepClimbCard from '@/components/StepClimbCard';
import RankHeader from '@/components/RankHeader';
import CabinPA from '@/components/CabinPA';
import ApproachTimer from '@/components/ApproachTimer';
import MapView from '@/components/MapView';
import ChartsButton from '@/components/ChartsButton';
import { Aircraft, AIRCRAFT_DB } from '@/data/aircraft';
import { useLogbook, FlightLogEntry } from '@/hooks/useLogbook';
import { Plane, MapPin, Save, CheckCircle, AlertCircle, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_AIRCRAFT_ID = 'B777-300ER';

export default function Index() {
  const firstAircraftId = Object.keys(AIRCRAFT_DB)[0] || DEFAULT_AIRCRAFT_ID;
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>(firstAircraftId);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(AIRCRAFT_DB[firstAircraftId] || null);
  const [weight, setWeight] = useState((selectedAircraft?.empty || 50000) + 10000);

  // flight mode (for speed calculators)
  const [mode, setMode] = useState<'takeoff' | 'inflight' | 'landing'>('takeoff');
  // bottom navigation active section
  const [activeSection, setActiveSection] = useState<'takeoff' | 'inflight' | 'landing' | 'checklist' | 'map'>('takeoff');

  const [metar, setMetar] = useState<any | null>(null);
  const [departureIcao, setDepartureIcao] = useState('');
  const [arrivalIcao, setArrivalIcao] = useState('');
  const [fuel, setFuel] = useState(0);
  const [cargo, setCargo] = useState(0);
  const [passengers, setPassengers] = useState(0);
  const [departureRunway, setDepartureRunway] = useState('');
  const [arrivalRunway, setArrivalRunway] = useState('');
  const [isSimBriefRunway, setIsSimBriefRunway] = useState(false);
  const [stepClimb, setStepClimb] = useState<string | null>(null);
  const [estTimeEnroute, setEstTimeEnroute] = useState<number | null>(null);
  const [originCoord, setOriginCoord] = useState<{ lat: number; lon: number } | null>(null);
  const [destCoord, setDestCoord] = useState<{ lat: number; lon: number } | null>(null);

  const weightInputRef = useRef<WeightInputRef>(null);
  const metarDisplayRef = useRef<MetarDisplayRef>(null);
  const runwaySelectorRef = useRef<RunwaySelectorRef>(null);
  const speedCalcTakeoffRef = useRef<SpeedCalculatorRef>(null);
  const speedCalcLandingRef = useRef<SpeedCalculatorRef>(null);

  const { entries, saveEntry, deleteEntry } = useLogbook();

  const currentAircraft = selectedAircraft || AIRCRAFT_DB[DEFAULT_AIRCRAFT_ID];

  const handleAircraftChange = (aircraftId: string, aircraft: Aircraft) => {
    if (!aircraft) return;
    setSelectedAircraftId(aircraftId);
    setSelectedAircraft(aircraft);
    setWeight(aircraft.empty + (aircraft.max - aircraft.empty) * 0.7);
  };

  const handleAdTrigger = useCallback(() => {}, []);

  const handleSimBriefImport = useCallback(async (data: any) => {
    try {
      handleAdTrigger();
      setDepartureIcao(data.departureIcao || '');
      setArrivalIcao(data.arrivalIcao || '');
      setFuel(data.fuel || 0);
      setCargo(data.cargo || 0);
      setPassengers(data.passengers || 0);
      setStepClimb(data.stepClimb || null);
      setEstTimeEnroute(data.estTimeEnroute ?? null);

      // coords
      if (data.originLat != null && data.originLon != null) setOriginCoord({ lat: data.originLat, lon: data.originLon });
      else setOriginCoord(null);
      if (data.destLat != null && data.destLon != null) setDestCoord({ lat: data.destLat, lon: data.destLon });
      else setDestCoord(null);

      if (data.departureRunway) {
        setDepartureRunway(data.departureRunway);
        setIsSimBriefRunway(true);
      }
      if (data.arrivalRunway) setArrivalRunway(data.arrivalRunway);

      if (weightInputRef.current) weightInputRef.current.setLoadData(data.fuel || 0, data.cargo || 0, data.passengers || 0);

      if (data.aircraftId && AIRCRAFT_DB[data.aircraftId]) {
        setSelectedAircraftId(data.aircraftId);
        setSelectedAircraft(AIRCRAFT_DB[data.aircraftId]);
      }

      setTimeout(() => {
        if (metarDisplayRef.current && data.departureIcao) metarDisplayRef.current.fetchForIcao(data.departureIcao);
      }, 500);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao processar dados do SimBrief');
    }
  }, [handleAdTrigger]);

  useEffect(() => {
    // auto-fetch when switching to landing mode (if arrival set)
    const doFetch = async () => {
      if (mode === 'landing' && arrivalIcao && arrivalIcao.length === 4) {
        if (metarDisplayRef.current) await metarDisplayRef.current.fetchForIcao(arrivalIcao);
        if (runwaySelectorRef.current && arrivalRunway) runwaySelectorRef.current.setRunway(arrivalRunway);
      }
      if (mode === 'takeoff' && departureIcao && departureIcao.length === 4) {
        if (metarDisplayRef.current) await metarDisplayRef.current.fetchForIcao(departureIcao);
        if (runwaySelectorRef.current && departureRunway) runwaySelectorRef.current.setRunway(departureRunway);
      }
    };
    doFetch();
  }, [mode, arrivalIcao, departureIcao, arrivalRunway, departureRunway]);

  const handleSaveToLogbook = useCallback(() => {
    if (!currentAircraft) { toast.error('Selecione uma aeronave primeiro'); return; }
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
      isSimBriefImport: false,
      flapConfig: mode === 'takeoff' ? takeoffSpeeds.flapConfig : landingSpeeds.flapConfig,
      estTimeEnroute: estTimeEnroute ?? undefined,
      stepClimb: stepClimb ?? undefined,
      originLat: originCoord?.lat,
      originLon: originCoord?.lon,
      destLat: destCoord?.lat,
      destLon: destCoord?.lon,
    });

    toast.success('Voo salvo no Logbook!', { description: `${departureIcao || '----'} → ${arrivalIcao || '----'}`, icon: <CheckCircle className="w-4 h-4" /> });
  }, [currentAircraft, departureIcao, arrivalIcao, selectedAircraftId, fuel, cargo, passengers, weight, metar, mode, saveEntry, estTimeEnroute, stepClimb, originCoord, destCoord]);

  const handleLoadFromLogbook = useCallback((entry: FlightLogEntry) => {
    setDepartureIcao(entry.departureIcao);
    setArrivalIcao(entry.arrivalIcao);
    if (AIRCRAFT_DB[entry.aircraftId]) { setSelectedAircraftId(entry.aircraftId); setSelectedAircraft(AIRCRAFT_DB[entry.aircraftId]); }
    setFuel(entry.fuel); setCargo(entry.cargo); setPassengers(entry.passengers);
    if (entry.originLat && entry.originLon) setOriginCoord({ lat: entry.originLat, lon: entry.originLon });
    if (entry.destLat && entry.destLon) setDestCoord({ lat: entry.destLat, lon: entry.destLon });
    toast.success('Voo carregado!', { description: `${entry.departureIcao || '----'} → ${entry.arrivalIcao || '----'}` });
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-32">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plane className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">IF ULTIMATE CALC</h1>
              <p className="text-sm text-muted-foreground">Infinite Flight Speed Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <RankHeader entries={entries} userName={localStorage.getItem('sb_user') || undefined} />
            <CabinPA arrivalIcao={arrivalIcao} temp={metar?.temperature ?? null} />
            <Logbook entries={entries} onLoad={handleLoadFromLogbook} onDelete={deleteEntry} />
          </div>
        </header>

        <SimBriefImport onImport={handleSimBriefImport} />

        {/* Active content */}
        <div className="space-y-4">
          {activeSection === 'takeoff' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card className="p-6 bg-card border-avionics-border space-y-6">
                  <AircraftSelector selectedAircraftId={selectedAircraftId} onSelect={handleAircraftChange} />
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />DEPARTURE</label>
                      <div className="flex items-center"><Input placeholder="ICAO (e.g., SBGR)" value={departureIcao} onChange={(e) => setDepartureIcao(e.target.value.toUpperCase())} maxLength={4} className="font-mono text-lg uppercase bg-card border-avionics-border flex-1" /><ChartsButton icao={departureIcao} /></div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />ARRIVAL</label>
                      <div className="flex items-center"><Input placeholder="ICAO (e.g., KJFK)" value={arrivalIcao} onChange={(e) => setArrivalIcao(e.target.value.toUpperCase())} maxLength={4} className="font-mono text-lg uppercase bg-card border-avionics-border flex-1" /><ChartsButton icao={arrivalIcao} /></div>
                    </div>
                  </div>
                  <WeightInput ref={weightInputRef} weight={weight} emptyWeight={currentAircraft.empty} maxWeight={currentAircraft.max} onWeightChange={setWeight} onDataChange={(f,c,p)=>{setFuel(f);setCargo(c);setPassengers(p);}} />
                </Card>

                <Card className="p-6 bg-card border-avionics-border space-y-4">
                  <MetarDisplay ref={metarDisplayRef} onMetarFetched={setMetar} activeIcao={departureIcao} contextLabel={departureIcao ? `${departureIcao} (Partida)` : 'Partida'} />
                  {metar && <RunwaySelector ref={runwaySelectorRef} windDirection={metar.windDirection} windSpeed={metar.windSpeed} suggestedRunway={departureRunway} isSimBriefSuggestion={isSimBriefRunway} />}
                  {metar && <CrosswindVisualizer windDir={metar.windDirection} windSpeed={metar.windSpeed} rwyHdg={Number(departureRunway.replace(/[^0-9]/g,''))*10 || null} />}
                  {stepClimb && <StepClimbCard stepClimb={stepClimb} />}
                </Card>
              </div>

              <div>
                <Card className="p-6 bg-card border-avionics-border h-full">
                  <SpeedCalculator ref={speedCalcTakeoffRef} aircraft={currentAircraft} weight={weight} mode="takeoff" headwind={metar?.windSpeed || 0} temperature={metar?.temperature ?? 15} />
                  <div className="mt-6 pt-4 border-t border-avionics-border"><Button onClick={handleSaveToLogbook} className="w-full gap-2 h-12 text-base font-mono"><Save className="w-5 h-5" />SALVAR NO LOGBOOK</Button></div>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'inflight' && (
            <Card className="p-6 bg-card border-avionics-border"><LiveFuel initialFuel={fuel} aircraft={currentAircraft} /></Card>
          )}

          {activeSection === 'landing' && (
            <Card className="p-6 bg-card border-avionics-border">
              <MetarDisplay ref={metarDisplayRef} onMetarFetched={setMetar} activeIcao={arrivalIcao} contextLabel={arrivalIcao ? `${arrivalIcao} (Chegada)` : 'Chegada'} />
              {metar && <RunwaySelector ref={runwaySelectorRef} windDirection={metar.windDirection} windSpeed={metar.windSpeed} suggestedRunway={arrivalRunway} isSimBriefSuggestion={isSimBriefRunway} />}
              {metar && <CrosswindVisualizer windDir={metar.windDirection} windSpeed={metar.windSpeed} rwyHdg={Number(arrivalRunway.replace(/[^0-9]/g,''))*10 || null} />}
              {stepClimb && <StepClimbCard stepClimb={stepClimb} />}

              <Accordion type="single" collapsible defaultValue="tod">
                <AccordionItem value="tod">
                  <AccordionTrigger>Planejamento de Descida (TOD)</AccordionTrigger>
                  <AccordionContent><TodCalculator currentAltitude={35000} /></AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-4"><SpeedCalculator ref={speedCalcLandingRef} aircraft={currentAircraft} weight={weight} mode="landing" headwind={metar?.windSpeed || 0} /><ApproachTimer /></div>

              <div className="mt-6 pt-4 border-t border-avionics-border"><Button onClick={handleSaveToLogbook} className="w-full gap-2 h-12 text-base font-mono"><Save className="w-5 h-5" />SALVAR NO LOGBOOK</Button></div>
            </Card>
          )}

          {activeSection === 'checklist' && (
            <Card className="p-4 bg-card border-avionics-border">
              <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Checklists</h2><div className="text-sm text-muted-foreground">Progresso Total: 45%</div></div></div>
              <Accordion type="multiple" defaultValue={[] as string[]}>
                <AccordionItem value="preflight"><AccordionTrigger>Pre-Flight</AccordionTrigger><AccordionContent><ChecklistComponent phase="preflight" /></AccordionContent></AccordionItem>
                <AccordionItem value="taxi"><AccordionTrigger>Taxi</AccordionTrigger><AccordionContent><ChecklistComponent phase="taxi" /></AccordionContent></AccordionItem>
                <AccordionItem value="takeoff"><AccordionTrigger>Takeoff</AccordionTrigger><AccordionContent><ChecklistComponent phase="takeoff" /></AccordionContent></AccordionItem>
                <AccordionItem value="landing"><AccordionTrigger>Landing</AccordionTrigger><AccordionContent><ChecklistComponent phase="landing" /></AccordionContent></AccordionItem>
              </Accordion>
            </Card>
          )}

          {activeSection === 'map' && (
            <Card className="p-4 bg-card border-avionics-border"><MapView origin={departureIcao || undefined} dest={arrivalIcao || undefined} originCoord={originCoord || undefined} destCoord={destCoord || undefined} departureIcao={departureIcao} arrivalIcao={arrivalIcao} /><div className="mt-3 text-xs text-muted-foreground">Toque para arrastar/zoom no mapa. Se as posições não aparecerem, experimente inserir códigos ICAO válidos.</div></Card>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-card/80 backdrop-blur-md border border-avionics-border rounded-full px-3 py-2 shadow-lg">
        <div className="flex gap-2 items-center">
          <button onClick={() => setActiveSection('takeoff')} className={`flex flex-col items-center p-2 rounded-md ${activeSection === 'takeoff' ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`} aria-label="Takeoff"><Plane className="w-5 h-5" /><span className="text-xs">Decolagem</span></button>
          <button onClick={() => setActiveSection('inflight')} className={`flex flex-col items-center p-2 rounded-md ${activeSection === 'inflight' ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`} aria-label="InFlight"><Plane className="w-5 h-5" /><span className="text-xs">Em Voo</span></button>
          <button onClick={() => setActiveSection('landing')} className={`flex flex-col items-center p-2 rounded-md ${activeSection === 'landing' ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`} aria-label="Landing"><MapPin className="w-5 h-5" /><span className="text-xs">Pouso</span></button>
          <button onClick={() => setActiveSection('checklist')} className={`flex flex-col items-center p-2 rounded-md ${activeSection === 'checklist' ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`} aria-label="Checklist"><ListChecks className="w-5 h-5" /><span className="text-xs">Checklist</span></button>
          <button onClick={() => setActiveSection('map')} className={`flex flex-col items-center p-2 rounded-md ${activeSection === 'map' ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`} aria-label="Map"><MapPin className="w-5 h-5" /><span className="text-xs">Mapa</span></button>
        </div>
      </div>

      {/* AdMob Banner Placeholder - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 w-full h-[60px] bg-slate-950 flex items-center justify-center z-40 border-t border-slate-800"><span className="text-slate-600 text-sm font-mono">AdMob Banner Area (Ready)</span></div>
    </div>
  );
}
import { useState, useRef, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
        {/* Main content controlled by bottom navigation (activeSection) */}
        <div className="space-y-4">
          {activeSection === 'takeoff' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card className="p-6 bg-card border-avionics-border space-y-6">
                  <AircraftSelector selectedAircraftId={selectedAircraftId} onSelect={handleAircraftChange} />
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        DEPARTURE
                      </label>
                      <div className="flex items-center">
                        <Input
                          placeholder="ICAO (e.g., SBGR)"
                          value={departureIcao}
                          onChange={(e) => setDepartureIcao(e.target.value.toUpperCase())}
                          maxLength={4}
                          className="font-mono text-lg uppercase bg-card border-avionics-border flex-1"
                        />
                        <ChartsButton icao={departureIcao} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        ARRIVAL
                      </label>
                      <div className="flex items-center">
                        <Input
                          placeholder="ICAO (e.g., KJFK)"
                          value={arrivalIcao}
                          onChange={(e) => setArrivalIcao(e.target.value.toUpperCase())}
                          maxLength={4}
                          className="font-mono text-lg uppercase bg-card border-avionics-border flex-1"
                        />
                        <ChartsButton icao={arrivalIcao} />
                      </div>
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
                  {metar && (
                    <CrosswindVisualizer
                      windDir={metar.windDirection}
                      windSpeed={metar.windSpeed}
                      rwyHdg={Number((mode === 'takeoff' ? departureRunway : arrivalRunway).replace(/[^0-9]/g, '')) * 10 || null}
                    />
                  )}
                  {stepClimb && (
                    <StepClimbCard stepClimb={stepClimb} />
                  )}
                </Card>
              </div>

              <div>
                <Card className="p-6 bg-card border-avionics-border h-full">
                  <SpeedCalculator
                    ref={speedCalcTakeoffRef}
                    aircraft={currentAircraft}
                    weight={weight}
                    mode="takeoff"
                    headwind={metar?.windSpeed || 0}
                    temperature={metar?.temperature ?? 15}
                  />

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
          )}

          {activeSection === 'inflight' && (
            <div>
              <Card className="p-6 bg-card border-avionics-border">
                <LiveFuel 
                  initialFuel={fuel}
                  aircraft={currentAircraft}
                />
              </Card>
            </div>
          )}

          {activeSection === 'landing' && (
            <div className="space-y-6">
              <Card className="p-6 bg-card border-avionics-border">
                <MetarDisplay 
                  ref={metarDisplayRef}
                  onMetarFetched={setMetar} 
                  activeIcao={arrivalIcao}
                  contextLabel={arrivalIcao ? `${arrivalIcao} (Chegada)` : 'Chegada'}
                />
                {metar && (
                  <RunwaySelector 
                    ref={runwaySelectorRef}
                    windDirection={metar.windDirection} 
                    windSpeed={metar.windSpeed}
                    suggestedRunway={arrivalRunway}
                    isSimBriefSuggestion={isSimBriefRunway}
                  />
                )}
                {metar && (
                  <CrosswindVisualizer
                    windDir={metar.windDirection}
                    windSpeed={metar.windSpeed}
                    rwyHdg={Number(arrivalRunway.replace(/[^0-9]/g, '')) * 10 || null}
                  />
                )}
                {stepClimb && (
                  <StepClimbCard stepClimb={stepClimb} />
                )}

                <Accordion type="single" collapsible defaultValue="tod">
                  <AccordionItem value="tod">
                    <AccordionTrigger>Planejamento de Descida (TOD)</AccordionTrigger>
                    <AccordionContent>
                      <TodCalculator currentAltitude={35000} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="mt-4">
                  <SpeedCalculator
                    ref={speedCalcLandingRef}
                    aircraft={currentAircraft}
                    weight={weight}
                    mode="landing"
                    headwind={metar?.windSpeed || 0}
                  />
                  <ApproachTimer />
                </div>

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
          )}

          {activeSection === 'checklist' && (
            <div>
              <Card className="p-4 bg-card border-avionics-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Checklists</h2>
                    <div className="text-sm text-muted-foreground">Progresso Total: 45%</div>
                  </div>
                </div>

                <Accordion type="multiple" defaultValue={[] as string[]}>
                  <AccordionItem value="preflight">
                    <AccordionTrigger>Pre-Flight</AccordionTrigger>
                    <AccordionContent>
                      <ChecklistComponent phase="preflight" />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="taxi">
                    <AccordionTrigger>Taxi</AccordionTrigger>
                    <AccordionContent>
                      <ChecklistComponent phase="taxi" />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="takeoff">
                    <AccordionTrigger>Takeoff</AccordionTrigger>
                    <AccordionContent>
                      <ChecklistComponent phase="takeoff" />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="landing">
                    <AccordionTrigger>Landing</AccordionTrigger>
                    <AccordionContent>
                      <ChecklistComponent phase="landing" />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            </div>
          )}

          {activeSection === 'map' && (
            <div>
              <Card className="p-4 bg-card border-avionics-border">
                <MapView
                  origin={departureIcao || undefined}
                  dest={arrivalIcao || undefined}
                  originCoord={originCoord || undefined}
                  destCoord={destCoord || undefined}
                  departureIcao={departureIcao}
                  arrivalIcao={arrivalIcao}
                />
                <div className="mt-3 text-xs text-muted-foreground">Toque para arrastar/zoom no mapa. Se as posições não aparecerem, experimente inserir códigos ICAO válidos.</div>
              </Card>
            </div>
          )}
        </div>
      }, 500);
    } catch (error) {
      console.error('Error processing SimBrief data:', error);
      toast.error('Erro ao processar dados do SimBrief');
    }
  }, [handleAdTrigger]);

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

    // Trigger ad counter on save
    handleAdTrigger();

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
      estTimeEnroute: estTimeEnroute ?? undefined,
      stepClimb: stepClimb ?? undefined,
      originLat: originCoord?.lat,
      originLon: originCoord?.lon,
      destLat: destCoord?.lat,
      destLon: destCoord?.lon,
    });

    toast.success('Voo salvo no Logbook!', {
      description: `${departureIcao || '----'} → ${arrivalIcao || '----'}`,
      icon: <CheckCircle className="w-4 h-4" />,
    });

    setIsSimBriefImport(false);
  }, [
    departureIcao, arrivalIcao, selectedAircraftId, currentAircraft,
    fuel, cargo, passengers, weight, metar, isSimBriefImport, mode, saveEntry, handleAdTrigger
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

  // Handle tab change with ad trigger
  const handleModeChange = useCallback((newMode: string) => {
    handleAdTrigger();
    setMode(newMode as 'takeoff' | 'inflight' | 'landing');
  }, [handleAdTrigger]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24">
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
          <div className="flex items-center gap-4">
            <RankHeader entries={entries} userName={localStorage.getItem('sb_user') || undefined} />
            <CabinPA arrivalIcao={arrivalIcao} temp={metar?.temperature ?? null} />
            <Logbook entries={entries} onLoad={handleLoadFromLogbook} onDelete={deleteEntry} />
            <Badge variant="secondary" className="text-sm font-mono bg-primary/20 text-primary border-primary/30 hidden sm:inline-flex">
              ALL JETS
            </Badge>
          </div>
        </div>

        {/* SimBrief Import */}
        <SimBriefImport onImport={handleSimBriefImport} />

        {/* Main / Mapa Tabs */}
        <div className="space-y-4">
          <Tabs defaultValue="main">
            <TabsList className="w-full grid grid-cols-2 mb-2">
              <TabsTrigger value="main" className="font-mono text-sm">PRINCIPAL</TabsTrigger>
              <TabsTrigger value="map" className="font-mono text-sm">MAPA</TabsTrigger>
            </TabsList>

            <TabsContent value="main">
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
                  <div className="flex items-center">
                    <Input
                      placeholder="ICAO (e.g., SBGR)"
                      value={departureIcao}
                      onChange={(e) => setDepartureIcao(e.target.value.toUpperCase())}
                      maxLength={4}
                      className="font-mono text-lg uppercase bg-card border-avionics-border flex-1"
                    />
                    <ChartsButton icao={departureIcao} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    ARRIVAL
                  </label>
                  <div className="flex items-center">
                    <Input
                      placeholder="ICAO (e.g., KJFK)"
                      value={arrivalIcao}
                      onChange={(e) => setArrivalIcao(e.target.value.toUpperCase())}
                      maxLength={4}
                      className="font-mono text-lg uppercase bg-card border-avionics-border flex-1"
                    />
                    <ChartsButton icao={arrivalIcao} />
                  </div>
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
              {/* TOD moved to Landing page */}
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
              {metar && (
                <CrosswindVisualizer
                  windDir={metar.windDirection}
                  windSpeed={metar.windSpeed}
                  rwyHdg={Number((mode === 'takeoff' ? departureRunway : arrivalRunway).replace(/[^0-9]/g, '')) * 10 || null}
                />
              )}
              {stepClimb && (
                <StepClimbCard stepClimb={stepClimb} />
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div>
            <Card className="p-6 bg-card border-avionics-border h-full">
              <Tabs value={mode} onValueChange={handleModeChange}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="takeoff" className="font-mono text-sm">
                    TAKEOFF
                  </TabsTrigger>
                  <TabsTrigger value="inflight" className="font-mono text-sm">
                    EM VOO
                  </TabsTrigger>
                  <TabsTrigger value="landing" className="font-mono text-sm">
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

                <TabsContent value="inflight">
                  <LiveFuel 
                    initialFuel={fuel}
                    aircraft={currentAircraft}
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
                  <ApproachTimer />
                </TabsContent>
              </Tabs>

              <ChecklistComponent />

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
            </TabsContent>

            <TabsContent value="map">
              <Card className="p-4 bg-card border-avionics-border">
                <MapView
                  origin={departureIcao || undefined}
                  dest={arrivalIcao || undefined}
                  originCoord={originCoord || undefined}
                  destCoord={destCoord || undefined}
                  departureIcao={departureIcao}
                  arrivalIcao={arrivalIcao}
                />
                <div className="mt-3 text-xs text-muted-foreground">Toque para arrastar/zoom no mapa. Se as posições não aparecerem, experimente inserir códigos ICAO válidos.</div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* AdMob Banner Placeholder - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 w-full h-[60px] bg-slate-950 flex items-center justify-center z-50 border-t border-slate-800">
        <span className="text-slate-600 text-sm font-mono">AdMob Banner Area (Ready)</span>
      </div>
    </div>
  );
}
