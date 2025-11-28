export interface AircraftFlap {
  name: string;
  takeoffFactor: number;
  landingFactor: number;
}

export interface Aircraft {
  id: string;
  name: string;
  category: 'Airbus' | 'Boeing' | 'Regional' | 'GA' | 'Military';
  emptyWeight: number;
  maxWeight: number;
  baseVr: number;
  maxVr: number;
  baseRef: number;
  maxRef: number;
  flaps: AircraftFlap[];
}

export const aircraftDatabase: Aircraft[] = [
  // Airbus
  {
    id: 'a320',
    name: 'A320',
    category: 'Airbus',
    emptyWeight: 42400,
    maxWeight: 78000,
    baseVr: 130,
    maxVr: 155,
    baseRef: 125,
    maxRef: 145,
    flaps: [
      { name: 'FLAPS 1', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS 2', takeoffFactor: 0.96, landingFactor: 0.95 },
      { name: 'FLAPS 3', takeoffFactor: 0.92, landingFactor: 0.90 },
      { name: 'FLAPS FULL', takeoffFactor: 0.88, landingFactor: 0.85 },
    ],
  },
  {
    id: 'a321',
    name: 'A321',
    category: 'Airbus',
    emptyWeight: 48500,
    maxWeight: 93500,
    baseVr: 135,
    maxVr: 160,
    baseRef: 130,
    maxRef: 150,
    flaps: [
      { name: 'FLAPS 1', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS 2', takeoffFactor: 0.96, landingFactor: 0.95 },
      { name: 'FLAPS 3', takeoffFactor: 0.92, landingFactor: 0.90 },
      { name: 'FLAPS FULL', takeoffFactor: 0.88, landingFactor: 0.85 },
    ],
  },
  {
    id: 'a330',
    name: 'A330-300',
    category: 'Airbus',
    emptyWeight: 124000,
    maxWeight: 233000,
    baseVr: 145,
    maxVr: 175,
    baseRef: 135,
    maxRef: 160,
    flaps: [
      { name: 'FLAPS 1+F', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS 2', takeoffFactor: 0.96, landingFactor: 0.95 },
      { name: 'FLAPS 3', takeoffFactor: 0.92, landingFactor: 0.90 },
      { name: 'FLAPS FULL', takeoffFactor: 0.88, landingFactor: 0.85 },
    ],
  },
  {
    id: 'a350',
    name: 'A350-900',
    category: 'Airbus',
    emptyWeight: 142400,
    maxWeight: 280000,
    baseVr: 150,
    maxVr: 180,
    baseRef: 140,
    maxRef: 165,
    flaps: [
      { name: 'FLAPS 1', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS 2', takeoffFactor: 0.96, landingFactor: 0.95 },
      { name: 'FLAPS 3', takeoffFactor: 0.92, landingFactor: 0.90 },
      { name: 'FLAPS FULL', takeoffFactor: 0.88, landingFactor: 0.85 },
    ],
  },

  // Boeing
  {
    id: 'b737-700',
    name: 'B737-700',
    category: 'Boeing',
    emptyWeight: 38147,
    maxWeight: 70080,
    baseVr: 130,
    maxVr: 150,
    baseRef: 125,
    maxRef: 140,
    flaps: [
      { name: 'FLAPS 1', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS 5', takeoffFactor: 0.96, landingFactor: 0.95 },
      { name: 'FLAPS 15', takeoffFactor: 0.92, landingFactor: 0.90 },
      { name: 'FLAPS 30', takeoffFactor: 0.88, landingFactor: 0.85 },
      { name: 'FLAPS 40', takeoffFactor: 0.85, landingFactor: 0.82 },
    ],
  },
  {
    id: 'b737-800',
    name: 'B737-800',
    category: 'Boeing',
    emptyWeight: 41413,
    maxWeight: 79010,
    baseVr: 135,
    maxVr: 155,
    baseRef: 130,
    maxRef: 145,
    flaps: [
      { name: 'FLAPS 1', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS 5', takeoffFactor: 0.96, landingFactor: 0.95 },
      { name: 'FLAPS 15', takeoffFactor: 0.92, landingFactor: 0.90 },
      { name: 'FLAPS 30', takeoffFactor: 0.88, landingFactor: 0.85 },
      { name: 'FLAPS 40', takeoffFactor: 0.85, landingFactor: 0.82 },
    ],
  },
  {
    id: 'b777-300er',
    name: 'B777-300ER',
    category: 'Boeing',
    emptyWeight: 167829,
    maxWeight: 351534,
    baseVr: 155,
    maxVr: 185,
    baseRef: 145,
    maxRef: 170,
    flaps: [
      { name: 'FLAPS 5', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS 15', takeoffFactor: 0.96, landingFactor: 0.95 },
      { name: 'FLAPS 20', takeoffFactor: 0.92, landingFactor: 0.90 },
      { name: 'FLAPS 25', takeoffFactor: 0.88, landingFactor: 0.85 },
      { name: 'FLAPS 30', takeoffFactor: 0.85, landingFactor: 0.82 },
    ],
  },
  {
    id: 'b787-9',
    name: 'B787-9',
    category: 'Boeing',
    emptyWeight: 128850,
    maxWeight: 254011,
    baseVr: 150,
    maxVr: 175,
    baseRef: 140,
    maxRef: 160,
    flaps: [
      { name: 'FLAPS 5', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS 15', takeoffFactor: 0.96, landingFactor: 0.95 },
      { name: 'FLAPS 20', takeoffFactor: 0.92, landingFactor: 0.90 },
      { name: 'FLAPS 25', takeoffFactor: 0.88, landingFactor: 0.85 },
      { name: 'FLAPS 30', takeoffFactor: 0.85, landingFactor: 0.82 },
    ],
  },

  // Regional
  {
    id: 'crj700',
    name: 'CRJ-700',
    category: 'Regional',
    emptyWeight: 19958,
    maxWeight: 33000,
    baseVr: 125,
    maxVr: 145,
    baseRef: 120,
    maxRef: 135,
    flaps: [
      { name: 'FLAPS 8', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS 20', takeoffFactor: 0.95, landingFactor: 0.93 },
      { name: 'FLAPS 30', takeoffFactor: 0.90, landingFactor: 0.87 },
      { name: 'FLAPS 45', takeoffFactor: 0.85, landingFactor: 0.82 },
    ],
  },
  {
    id: 'e175',
    name: 'E175',
    category: 'Regional',
    emptyWeight: 21890,
    maxWeight: 38790,
    baseVr: 128,
    maxVr: 148,
    baseRef: 122,
    maxRef: 138,
    flaps: [
      { name: 'FLAPS 2', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS 3', takeoffFactor: 0.96, landingFactor: 0.94 },
      { name: 'FLAPS 4', takeoffFactor: 0.92, landingFactor: 0.89 },
      { name: 'FLAPS 5', takeoffFactor: 0.88, landingFactor: 0.84 },
      { name: 'FLAPS FULL', takeoffFactor: 0.85, landingFactor: 0.80 },
    ],
  },

  // GA
  {
    id: 'c172',
    name: 'Cessna 172',
    category: 'GA',
    emptyWeight: 743,
    maxWeight: 1157,
    baseVr: 55,
    maxVr: 65,
    baseRef: 50,
    maxRef: 60,
    flaps: [
      { name: 'FLAPS UP', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS 10', takeoffFactor: 0.95, landingFactor: 0.93 },
      { name: 'FLAPS FULL', takeoffFactor: 0.90, landingFactor: 0.85 },
    ],
  },

  // Military
  {
    id: 'f22',
    name: 'F-22 Raptor',
    category: 'Military',
    emptyWeight: 19700,
    maxWeight: 38000,
    baseVr: 140,
    maxVr: 170,
    baseRef: 135,
    maxRef: 160,
    flaps: [
      { name: 'FLAPS UP', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS HALF', takeoffFactor: 0.92, landingFactor: 0.88 },
    ],
  },
  {
    id: 'f18',
    name: 'F/A-18 Super Hornet',
    category: 'Military',
    emptyWeight: 14552,
    maxWeight: 29937,
    baseVr: 135,
    maxVr: 165,
    baseRef: 130,
    maxRef: 155,
    flaps: [
      { name: 'FLAPS UP', takeoffFactor: 1.0, landingFactor: 1.0 },
      { name: 'FLAPS HALF', takeoffFactor: 0.92, landingFactor: 0.88 },
      { name: 'FLAPS FULL', takeoffFactor: 0.85, landingFactor: 0.80 },
    ],
  },
];
