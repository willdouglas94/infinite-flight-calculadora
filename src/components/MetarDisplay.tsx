import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchMetar, MetarData } from '@/utils/metar';
import { Cloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MetarDisplayProps {
  onMetarFetched: (metar: MetarData) => void;
  activeIcao?: string;
  contextLabel?: string;
}

export interface MetarDisplayRef {
  fetchForIcao: (icaoCode: string) => Promise<void>;
}

const MetarDisplay = forwardRef<MetarDisplayRef, MetarDisplayProps>(
  ({ onMetarFetched, activeIcao, contextLabel }, ref) => {
  const [icao, setIcao] = useState('');
  const [metar, setMetar] = useState<MetarData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFetch = async () => {
    // Use activeIcao from props if available, otherwise use local icao state
    const targetIcao = (activeIcao || icao).trim().toUpperCase();
    
    if (!targetIcao || targetIcao.length !== 4) {
      toast({
        title: 'Invalid ICAO',
        description: 'Please enter a 4-letter ICAO code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const data = await fetchMetar(targetIcao);
      if (data) {
        setMetar(data);
        setIcao(targetIcao); // Update local state to match
        onMetarFetched(data);
        toast({
          title: 'METAR Fetched',
          description: `Weather data loaded for ${targetIcao}`,
        });
      } else {
        toast({
          title: 'METAR Not Found',
          description: `No weather data available for ${targetIcao}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch METAR data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchForIcao = async (icaoCode: string) => {
    const targetIcao = icaoCode.trim().toUpperCase();
    if (targetIcao.length === 4) {
      setIcao(targetIcao);
      await handleFetch();
    }
  };

  // Expose method to fetch METAR from parent
  useImperativeHandle(ref, () => ({
    fetchForIcao,
  }));

  // Auto-fetch METAR when user types 4 letters
  useEffect(() => {
    if (icao.length === 4) {
      const timeoutId = setTimeout(() => {
        handleFetch();
      }, 500); // 500ms debounce to avoid rapid fetches while typing
      
      return () => clearTimeout(timeoutId);
    }
  }, [icao]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Cloud className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          METAR{contextLabel ? `: ${contextLabel}` : ''}
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="ICAO (e.g., SBGR)"
          value={icao}
          onChange={(e) => setIcao(e.target.value.toUpperCase())}
          maxLength={4}
          className="flex-1 font-mono text-lg uppercase bg-card border-avionics-border"
        />
        <Button
          onClick={handleFetch}
          disabled={loading}
          className="min-w-[140px] font-mono"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Cloud className="mr-2 h-4 w-4" />
              FETCH METAR
            </>
          )}
        </Button>
      </div>

      {metar && (
        <div className="space-y-2">
          <div className="bg-warning/10 border border-warning/30 rounded p-3">
            <p className="font-mono text-xs text-warning break-all">{metar.raw}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-card/50 border border-avionics-border rounded p-2">
              <div className="text-xs text-muted-foreground">WIND DIR</div>
              <div className="text-xl font-mono text-primary">{metar.windDirection.toString().padStart(3, '0')}°</div>
            </div>
            <div className="bg-card/50 border border-avionics-border rounded p-2">
              <div className="text-xs text-muted-foreground">WIND SPD</div>
              <div className="text-xl font-mono text-primary">{metar.windSpeed} KT</div>
            </div>
            <div className="bg-card/50 border border-avionics-border rounded p-2">
              <div className="text-xs text-muted-foreground">TEMP</div>
              <div className="text-xl font-mono text-primary">{metar.temperature}°C</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MetarDisplay.displayName = 'MetarDisplay';

export default MetarDisplay;
