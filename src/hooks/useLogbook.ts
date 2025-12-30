import { useState, useEffect, useCallback } from "react";

export interface FlightLogEntry {
  id: string;
  savedAt: string;
  departureIcao: string;
  arrivalIcao: string;
  aircraftId: string;
  aircraftName: string;
  fuel: number;
  cargo: number;
  passengers: number;
  totalWeight: number;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  metarRaw: string;
  v1: number;
  vr: number;
  v2: number;
  vref: number;
  vapp: number;
  isSimBriefImport: boolean;
  flapConfig: string;
  // Optional enhanced fields
  estTimeEnroute?: number; // in hours (can be fractional)
  stepClimb?: string; // e.g. "310/350/390"
  // Optional coordinates from SimBrief
  originLat?: number;
  originLon?: number;
  destLat?: number;
  destLon?: number;
}

const STORAGE_KEY = "flight_history";

export function useLogbook() {
  const [entries, setEntries] = useState<FlightLogEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch {
        setEntries([]);
      }
    }
  }, []);

  const saveEntry = useCallback((entry: Omit<FlightLogEntry, "id" | "savedAt">) => {
    const newEntry: FlightLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    };
    
    setEntries((prev) => {
      const updated = [newEntry, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    
    return newEntry;
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { entries, saveEntry, deleteEntry, clearAll };
}
