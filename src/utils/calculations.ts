import { Aircraft } from '@/data/aircraft';

export interface SpeedResults {
  v1: number;
  vr: number;
  v2: number;
  vref: number;
  vapp: number;
}

// Utility function to ensure valid numbers
export function safeNumber(value: number | undefined | null, fallback: number = 0): number {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return value;
}

export function calculateWeightRatio(
  currentWeight: number,
  emptyWeight: number,
  maxWeight: number
): number {
  if (currentWeight <= emptyWeight) return 0;
  if (currentWeight >= maxWeight) return 1;
  return (currentWeight - emptyWeight) / (maxWeight - emptyWeight);
}

export function calculateTakeoffSpeeds(
  aircraft: Aircraft,
  weightRatio: number,
  flapIndex: number,
  headwind: number = 0
): { v1: number; vr: number; v2: number } {
  const flap = aircraft.to.flaps[flapIndex];
  const bVr = aircraft.to.bVr!;
  const mVr = aircraft.to.mVr!;
  
  // Base VR calculation with weight ratio
  let vr = bVr + (mVr - bVr) * weightRatio;
  
  // Apply flap factor
  vr = vr * flap.f;
  
  // V1 is 5 knots below VR
  const v1 = vr - 5;
  
  // V2 is 10 knots above VR
  const v2 = vr + 10;
  
  return {
    v1: Math.round(v1),
    vr: Math.round(vr),
    v2: Math.round(v2),
  };
}

export function calculateLandingSpeeds(
  aircraft: Aircraft,
  weightRatio: number,
  flapIndex: number,
  headwind: number = 0
): { vref: number; vapp: number } {
  const flap = aircraft.ldg.flaps[flapIndex];
  const bRef = aircraft.ldg.bRef!;
  const mRef = aircraft.ldg.mRef!;
  
  // Base VREF calculation with weight ratio
  let vref = bRef + (mRef - bRef) * weightRatio;
  
  // Apply flap factor
  vref = vref * flap.f;
  
  // VAPP = VREF + (half of headwind + 5), limited between 5 and 20
  const windCorrection = Math.max(5, Math.min(20, (headwind / 2) + 5));
  const vapp = vref + windCorrection;
  
  return {
    vref: Math.round(vref),
    vapp: Math.round(vapp),
  };
}

export function calculateWindComponents(
  windDirection: number,
  windSpeed: number,
  runwayHeading: number
): { headwind: number; crosswind: number } {
  const angleDiff = Math.abs(windDirection - runwayHeading);
  const angleRad = (angleDiff * Math.PI) / 180;
  
  const headwind = Math.round(windSpeed * Math.cos(angleRad));
  const crosswind = Math.round(windSpeed * Math.sin(angleRad));
  
  return { headwind, crosswind };
}
