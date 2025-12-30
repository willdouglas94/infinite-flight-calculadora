import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer } from 'lucide-react';

export default function ApproachTimer(){
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const ref = useRef<number | null>(null);

  useEffect(()=>{
    if (running) {
      ref.current = window.setInterval(()=> setElapsed(e=>e+1), 1000);
    } else {
      if (ref.current) { clearInterval(ref.current); ref.current = null; }
    }
    return ()=>{ if (ref.current) clearInterval(ref.current); };
  },[running]);

  const start = ()=> setRunning(true);
  const stop = ()=> setRunning(false);
  const reset = ()=> { setRunning(false); setElapsed(0); };

  const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss = String(elapsed%60).padStart(2,'0');

  return (
    <Card className="p-3 bg-card border-avionics-border mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Timer className="w-5 h-5 text-primary" /><div className="text-sm font-semibold">Cronômetro de Aproximação</div></div>
        <div className="text-sm font-mono text-foreground">{mm}:{ss}</div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={start} disabled={running}>Start</Button>
        <Button onClick={stop} variant="ghost" disabled={!running}>Stop</Button>
        <Button onClick={reset} variant="outline">Reset</Button>
      </div>
    </Card>
  );
}
