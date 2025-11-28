import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Aircraft, aircraftDatabase } from '@/data/aircraft';
import { Plane } from 'lucide-react';

interface AircraftSelectorProps {
  selectedAircraft: Aircraft | null;
  onSelect: (aircraft: Aircraft) => void;
}

export default function AircraftSelector({ selectedAircraft, onSelect }: AircraftSelectorProps) {
  const groupedAircraft = aircraftDatabase.reduce((acc, aircraft) => {
    if (!acc[aircraft.category]) {
      acc[aircraft.category] = [];
    }
    acc[aircraft.category].push(aircraft);
    return acc;
  }, {} as Record<string, Aircraft[]>);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Plane className="w-4 h-4 text-primary" />
        AIRCRAFT
      </label>
      <Select
        value={selectedAircraft?.id}
        onValueChange={(id) => {
          const aircraft = aircraftDatabase.find((a) => a.id === id);
          if (aircraft) onSelect(aircraft);
        }}
      >
        <SelectTrigger className="bg-card border-avionics-border text-lg font-mono">
          <SelectValue placeholder="Select aircraft..." />
        </SelectTrigger>
        <SelectContent className="bg-card border-avionics-border">
          {Object.entries(groupedAircraft).map(([category, aircraft]) => (
            <SelectGroup key={category}>
              <SelectLabel className="text-primary font-semibold">{category}</SelectLabel>
              {aircraft.map((ac) => (
                <SelectItem key={ac.id} value={ac.id} className="font-mono">
                  {ac.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
