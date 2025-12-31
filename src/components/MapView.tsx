import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths for Vite/ESM
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Coord = { lat: number; lon: number };

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || positions.length === 0) return;
    try {
      const latlngs = positions.map((p) => L.latLng(p[0], p[1]));
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch (e) {
      // ignore
    }
  }, [map, positions]);
  return null;
}

async function geocodeIcao(icao: string): Promise<Coord | null> {
  if (!icao) return null;
  const key = `geo:${icao.toUpperCase()}`;
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached) as Coord;
    }
  } catch (e) {
    // ignore
  }
  const q = encodeURIComponent(`${icao} airport`);
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
    const json = await res.json();
    if (Array.isArray(json) && json.length > 0) {
      const first = json[0];
      const coord = { lat: Number(first.lat), lon: Number(first.lon) };
      try { localStorage.setItem(key, JSON.stringify(coord)); } catch (e) { /* ignore */ }
      return { lat: Number(first.lat), lon: Number(first.lon) };
    }
  } catch (e) {
    console.warn('Geocode failed', e);
  }
  return null;
}

export default function MapView({ origin, dest, originCoord: originFromProps, destCoord: destFromProps, departureIcao, arrivalIcao }: {
  origin?: string | null;
  dest?: string | null;
  originCoord?: Coord | null;
  destCoord?: Coord | null;
  departureIcao?: string | null;
  arrivalIcao?: string | null;
}) {
  const [originCoord, setOriginCoord] = useState<Coord | null>(originFromProps || null);
  const [destCoord, setDestCoord] = useState<Coord | null>(destFromProps || null);

  useEffect(() => {
    // If props provide coords (from SimBrief) use them. Otherwise try geocoding by ICAO
    let mounted = true;
    (async () => {
      if (originFromProps) {
        setOriginCoord(originFromProps);
        return;
      }
      if (origin && origin.length === 4) {
        const g = await geocodeIcao(origin);
        if (mounted) setOriginCoord(g);
      } else {
        setOriginCoord(null);
      }
    })();
    return () => { mounted = false; };
  }, [origin, originFromProps]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (destFromProps) {
        setDestCoord(destFromProps);
        return;
      }
      if (dest && dest.length === 4) {
        const g = await geocodeIcao(dest);
        if (mounted) setDestCoord(g);
      } else {
        setDestCoord(null);
      }
    })();
    return () => { mounted = false; };
  }, [dest, destFromProps]);

  const positions: [number, number][] = [];
  if (originCoord) positions.push([originCoord.lat, originCoord.lon]);
  if (destCoord) positions.push([destCoord.lat, destCoord.lon]);

  const TileLayerAny = TileLayer as any;
  const MapContainerAny = MapContainer as any;
  
  return (
    <div className="w-full h-[60vh] min-h-[500px] rounded-md overflow-hidden relative">
      <MapContainerAny center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} touchZoom={true}>
        <TileLayerAny
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {originCoord && (
          <Marker position={[originCoord.lat, originCoord.lon]}>
          </Marker>
        )}

        {destCoord && (
          <Marker position={[destCoord.lat, destCoord.lon]}>
          </Marker>
        )}

        {positions.length >= 2 && (
          <>
            <Polyline positions={positions} pathOptions={{ color: '#ef4444', weight: 6 }} />
            <FitBounds positions={positions} />
          </>
        )}

        {positions.length === 1 && <FitBounds positions={positions} />}
      </MapContainerAny>

      {/* Floating Chart Buttons Panel */}
      <div className="absolute top-3 right-3 z-50 bg-card/90 border border-avionics-border rounded-md p-3 shadow-lg w-56">
        <div className="text-sm font-semibold mb-2">Abrir Cartas (PDF)</div>
        <div className="flex flex-col gap-2">
          <a href={`https://chartfox.org/${(departureIcao||'').toUpperCase()}`} target="_blank" rel="noreferrer" className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 rounded text-xs text-white text-center">🛫 Cartas de Saída {(departureIcao||'').toUpperCase()}</a>
          <a href={`https://chartfox.org/${(arrivalIcao||'').toUpperCase()}`} target="_blank" rel="noreferrer" className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 rounded text-xs text-white text-center">🛬 Cartas de Chegada {(arrivalIcao||'').toUpperCase()}</a>
        </div>
        <div className="text-xs text-muted-foreground mt-2">Se as coordenadas do SimBrief estiverem presentes, a rota será desenhada automaticamente.</div>
      </div>

      {/* Message when no coords */}
      {positions.length < 2 && !originCoord && !destCoord && (
        <div className="absolute left-1/2 -translate-x-1/2 top-4 z-40 bg-yellow-900/80 text-yellow-100 px-3 py-1 rounded text-sm">Importe o plano SimBrief para ver a rota</div>
      )}
    </div>
  );
}
