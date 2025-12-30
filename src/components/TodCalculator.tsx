import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingDown } from 'lucide-react';

interface Props {
  currentAltitude?: number; // ft
}

export default function TodCalculator({ currentAltitude }: Props) {
  const [altNow, setAltNow] = useState<number>(currentAltitude || 35000);
  const [altTarget, setAltTarget] = useState<number>(3000);
  const [gs, setGs] = useState<number>(250);
  const [distance, setDistance] = useState<number>(0);
  const [vs, setVs] = useState<number>(-1500);

  useEffect(() => {
    const d = ((altNow - altTarget) / 1000) * 3; // NM
    const suggestedVs = -Math.round((gs / 2) * 10); // fpm negative
    setDistance(Math.max(0, Number(d.toFixed(1))));
    setVs(suggestedVs);
  }, [altNow, altTarget, gs]);

  return (
    <Card className="p-4 bg-card border-avionics-border mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-primary" />
          <div className="text-sm font-semibold">Top of Descent (TOD)</div>
        </div>
        <div className="text-xs text-muted-foreground">Calculadora rápida</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Alt Atual (ft)</label>
          <Input value={String(altNow)} onChange={(e:any)=>setAltNow(Number(e.target.value)||0)} className="font-mono" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Alt Alvo (ft)</label>
          <Input value={String(altTarget)} onChange={(e:any)=>setAltTarget(Number(e.target.value)||0)} className="font-mono" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Ground Speed (GS)</label>
          <Input value={String(gs)} onChange={(e:any)=>setGs(Number(e.target.value)||0)} className="font-mono" />
        </div>
      </div>

      <div className="mt-3 bg-avionics-panel p-3 rounded-md border border-avionics-border">
        <div className="text-sm text-muted-foreground">Inicie a descida em:</div>
        <div className="text-2xl font-mono font-bold text-primary">{distance} NM</div>
        <div className="text-sm mt-1">Razão sugerida: <span className="font-mono font-semibold">{vs} fpm</span></div>
        <div className="mt-3">
          <Button variant="secondary" onClick={()=>{navigator.clipboard?.writeText(`${distance} NM, VS ${vs} fpm`)}}>
            Copiar Planejamento
          </Button>
        </div>
      </div>
    </Card>
  );
}
