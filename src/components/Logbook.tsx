import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FlightLogEntry } from '@/hooks/useLogbook';
import { History, Trash2, RotateCcw, Plane, Calendar, MapPin, Users, Fuel, Package, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogbookProps {
  entries: FlightLogEntry[];
  onLoad: (entry: FlightLogEntry) => void;
  onDelete: (id: string) => void;
}

export default function Logbook({ entries, onLoad, onDelete }: LogbookProps) {
  const [open, setOpen] = useState(false);

  const handleLoad = (entry: FlightLogEntry) => {
    onLoad(entry);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 border-avionics-border">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">MEU HISTÓRICO</span>
          {entries.length > 0 && (
            <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary">
              {entries.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg bg-card border-avionics-border">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <History className="w-5 h-5 text-primary" />
            LOGBOOK - Histórico de Voos
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Plane className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">Nenhum voo salvo ainda</p>
              <p className="text-xs mt-1">Clique em "Salvar no Logbook" após calcular</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <FlightCard
                  key={entry.id}
                  entry={entry}
                  onLoad={() => handleLoad(entry)}
                  onDelete={() => onDelete(entry.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface FlightCardProps {
  entry: FlightLogEntry;
  onLoad: () => void;
  onDelete: () => void;
}

function FlightCard({ entry, onLoad, onDelete }: FlightCardProps) {
  const formattedDate = format(new Date(entry.savedAt), "dd MMM yyyy • HH:mm", { locale: ptBR });

  return (
    <div className="bg-avionics-panel border border-avionics-border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-mono font-bold text-primary">{entry.departureIcao || '----'}</span>
            <span className="text-muted-foreground">➝</span>
            <span className="text-lg font-mono font-bold text-primary">{entry.arrivalIcao || '----'}</span>
          </div>
        </div>
        {entry.isSimBriefImport && (
          <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
            <Download className="w-3 h-3 mr-1" />
            SimBrief
          </Badge>
        )}
      </div>

      {/* Aircraft Info */}
      <div className="flex items-center gap-2 text-sm">
        <Plane className="w-4 h-4 text-muted-foreground" />
        <span className="text-foreground font-medium">{entry.aircraftName}</span>
      </div>
      {/* Extra SimBrief Info */}
      {(entry.estTimeEnroute || entry.stepClimb) && (
        <div className="text-xs text-muted-foreground mt-1 grid grid-cols-2 gap-2">
          {entry.estTimeEnroute ? <div>ETA Est.: <span className="font-mono">{entry.estTimeEnroute} h</span></div> : null}
          {entry.stepClimb ? <div>Step Climb: <span className="font-mono">{entry.stepClimb}</span></div> : null}
        </div>
      )}

      {/* Load Summary */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Fuel className="w-3 h-3" />
          <span>{(entry.fuel / 1000).toFixed(1)}t</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Package className="w-3 h-3" />
          <span>{(entry.cargo / 1000).toFixed(1)}t</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>{entry.passengers} pax</span>
        </div>
      </div>

      {/* Speeds Summary */}
      <div className="flex gap-2 flex-wrap">
        {entry.v1 > 0 && (
          <Badge variant="outline" className="text-xs font-mono border-warning/50 text-warning">
            V1: {entry.v1}
          </Badge>
        )}
        {entry.vr > 0 && (
          <Badge variant="outline" className="text-xs font-mono border-primary/50 text-primary">
            VR: {entry.vr}
          </Badge>
        )}
        {entry.v2 > 0 && (
          <Badge variant="outline" className="text-xs font-mono border-success/50 text-success">
            V2: {entry.v2}
          </Badge>
        )}
        {entry.vref > 0 && (
          <Badge variant="outline" className="text-xs font-mono border-primary/50 text-primary">
            VREF: {entry.vref}
          </Badge>
        )}
        {entry.vapp > 0 && (
          <Badge variant="outline" className="text-xs font-mono border-success/50 text-success">
            VAPP: {entry.vapp}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-avionics-border">
        <Button
          variant="secondary"
          size="sm"
          onClick={onLoad}
          className="flex-1 gap-2"
        >
          <RotateCcw className="w-3 h-3" />
          Carregar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
