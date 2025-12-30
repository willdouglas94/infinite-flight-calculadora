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

export default function MapView({ origin, dest }: { origin?: string | null; dest?: string | null }) {
  const [originCoord, setOriginCoord] = useState<Coord | null>(null);
  const [destCoord, setDestCoord] = useState<Coord | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (origin && origin.length === 4) {
        const g = await geocodeIcao(origin);
        if (mounted) setOriginCoord(g);
      } else {
        setOriginCoord(null);
      }
    })();
    return () => { mounted = false; };
  }, [origin]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (dest && dest.length === 4) {
        const g = await geocodeIcao(dest);
        if (mounted) setDestCoord(g);
      } else {
        setDestCoord(null);
      }
    })();
    return () => { mounted = false; };
  }, [dest]);

  const positions: [number, number][] = [];
  if (originCoord) positions.push([originCoord.lat, originCoord.lon]);
  if (destCoord) positions.push([destCoord.lat, destCoord.lon]);

  return (
    <div className="w-full h-80 sm:h-[520px] md:h-[640px] rounded-md overflow-hidden">
      <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} touchZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
            <Polyline positions={positions} pathOptions={{ color: '#60a5fa' }} />
            <FitBounds positions={positions} />
          </>
        )}

        {positions.length === 1 && <FitBounds positions={positions} />}
      </MapContainer>
    </div>
  );
}
