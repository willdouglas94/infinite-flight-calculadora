import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchMetar, MetarData } from '@/utils/metar';
import { Cloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MetarDisplayProps {
  onMetarFetched: (metar: MetarData) => void;
}

export default function MetarDisplay({ onMetarFetched }: MetarDisplayProps) {
  const [icao, setIcao] = useState('');
  const [metar, setMetar] = useState<MetarData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFetch = async () => {
    if (!icao || icao.length !== 4) {
      toast({
        title: 'Invalid ICAO',
        description: 'Please enter a 4-letter ICAO code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const data = await fetchMetar(icao);
      if (data) {
        setMetar(data);
        onMetarFetched(data);
        toast({
          title: 'METAR Fetched',
          description: `Weather data loaded for ${icao.toUpperCase()}`,
        });
      } else {
        toast({
          title: 'METAR Not Found',
          description: `No weather data available for ${icao.toUpperCase()}`,
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
              LOADING
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
}
