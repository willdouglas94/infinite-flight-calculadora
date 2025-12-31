import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { List } from 'lucide-react';

const DEFAULT_CHECKLISTS: Record<string, string[]> = {
  'Pre-Flight': ['Parking Brake Set', 'Throttle Idle', 'Flaps Up', 'Instruments Check'],
  'Engine Start': ['Beacon On', 'Fuel Pumps On', 'Start Engines', 'Oil Pressure Green'],
  'Taxi & Takeoff': ['Taxi Lights On', 'Flaps as required', 'Transponder TA/RA', 'Takeoff Briefing'],
  'Cruise': ['Cruise Power Set', 'Auto Pilot On', 'Fuel Checks'],
  'Approach & Landing': ['Landing Lights On', 'Seatbelts Fastened', 'Gear Down', 'Briefing Complete'],
};

interface ChecklistComponentProps {
  phase?: string;
}

export default function ChecklistComponent({ phase }: ChecklistComponentProps) {
  const [state, setState] = useState<Record<string, boolean>>({});

  useEffect(()=>{
    // initialize from localStorage
    const saved = localStorage.getItem('efb_checklists_v1');
    if (saved) {
      try { setState(JSON.parse(saved)); return; } catch {}
    }
    const initial: Record<string, boolean> = {};
    Object.keys(DEFAULT_CHECKLISTS).forEach(k=>{
      DEFAULT_CHECKLISTS[k].forEach(item=>{ initial[`${k}::${item}`] = false; });
    });
    setState(initial);
  },[]);

  useEffect(()=>{ localStorage.setItem('efb_checklists_v1', JSON.stringify(state)); },[state]);

  const toggle = (key:string)=> setState(prev=>({ ...prev, [key]: !prev[key]}));
  const resetAll = ()=>{
    const cleared: Record<string, boolean> = {};
    Object.keys(DEFAULT_CHECKLISTS).forEach(k=> DEFAULT_CHECKLISTS[k].forEach(item=> cleared[`${k}::${item}`]=false));
    setState(cleared);
  };

  return (
    <Card className="p-4 bg-card border-avionics-border mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2"><List className="w-5 h-5 text-primary" /> <div className="text-sm font-semibold">Checklists</div></div>
        <div>
          <Button size="sm" variant="ghost" onClick={resetAll}>Resetar Checklists</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {Object.entries(DEFAULT_CHECKLISTS).map(([phase, items])=> (
          <div key={phase} className="bg-avionics-panel p-2 rounded-md border border-avionics-border">
            <div className="text-xs text-muted-foreground font-medium mb-2">{phase}</div>
            <div className="grid gap-1">
              {items.map(item=>{
                const key = `${phase}::${item}`;
                return (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={!!state[key]} onCheckedChange={()=>toggle(key)} />
                    <span className={state[key] ? 'line-through text-muted-foreground' : ''}>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
