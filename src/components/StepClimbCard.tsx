import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUp } from 'lucide-react';

interface Props { stepClimb?: string | null }

export default function StepClimbCard({ stepClimb }: Props) {
  if (!stepClimb) return null;
  return (
    <Card className="p-3 bg-card border-avionics-border mt-4">
      <div className="flex items-center gap-3">
        <ArrowUp className="w-5 h-5 text-primary" />
        <div>
          <div className="text-sm font-semibold">Perfil de Subida Planejado</div>
          <div className="text-xs text-muted-foreground font-mono mt-1">{stepClimb}</div>
        </div>
      </div>
    </Card>
  );
}
