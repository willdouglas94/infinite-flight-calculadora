import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Aircraft, getAircraftByGroup } from '@/data/aircraft';
import { Plane } from 'lucide-react';

interface AircraftSelectorProps {
  selectedAircraftId: string | null;
  onSelect: (aircraftId: string, aircraft: Aircraft) => void;
}

export default function AircraftSelector({ selectedAircraftId, onSelect }: AircraftSelectorProps) {
  const groupedAircraft = getAircraftByGroup();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Plane className="w-4 h-4 text-primary" />
        AIRCRAFT
      </label>
      <Select
        value={selectedAircraftId || undefined}
        onValueChange={(id) => {
          const grouped = getAircraftByGroup();
          for (const group of Object.values(grouped)) {
            const found = group.find(([aircraftId]) => aircraftId === id);
            if (found) {
              onSelect(found[0], found[1]);
              break;
            }
          }
        }}
      >
        <SelectTrigger className="bg-card border-avionics-border text-lg font-mono">
          <SelectValue placeholder="Select aircraft..." />
        </SelectTrigger>
        <SelectContent className="bg-card border-avionics-border z-50">
          {Object.entries(groupedAircraft).map(([group, aircraft]) => (
            <SelectGroup key={group}>
              <SelectLabel className="text-primary font-semibold">{group}</SelectLabel>
              {aircraft.map(([id, ac]) => (
                <SelectItem key={id} value={id} className="font-mono">
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
