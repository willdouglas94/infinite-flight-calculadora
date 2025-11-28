export interface AircraftFlap {
  l: string; // label
  f: number; // factor
}

export interface AircraftPhase {
  flaps: AircraftFlap[];
  bVr?: number; // base Vr (takeoff only)
  mVr?: number; // max Vr (takeoff only)
  bRef?: number; // base Ref (landing only)
  mRef?: number; // max Ref (landing only)
}

export interface Aircraft {
  name: string;
  type: 'narrow' | 'heavy' | 'super' | 'ga' | 'fighter' | 'regional' | 'prop' | 'mil_transport' | 'warbird';
  empty: number;
  max: number;
  group: string;
  to: AircraftPhase; // takeoff
  ldg: AircraftPhase; // landing
}

export const AIRCRAFT_DB: Record<string, Aircraft> = {
  // --- AIRBUS ---
  "A220-300": { name: "Airbus A220-300", type: "narrow", empty: 37000, max: 69900, group: "Airbus", to: { flaps: [{l:"Config 1",f:1.0}, {l:"Config 2",f:0.95}], bVr: 125, mVr: 150 }, ldg: { flaps: [{l:"Config 3",f:1.04}, {l:"Config FULL",f:1.0}], bRef: 120, mRef: 145 } },
  "A318": { name: "Airbus A318", type: "narrow", empty: 39500, max: 68000, group: "Airbus", to: { flaps: [{l:"Config 1+F",f:1.0}, {l:"Config 2",f:0.94}], bVr: 120, mVr: 145 }, ldg: { flaps: [{l:"Config 3",f:1.05}, {l:"Config FULL",f:1.0}], bRef: 115, mRef: 140 } },
  "A319": { name: "Airbus A319", type: "narrow", empty: 40800, max: 75500, group: "Airbus", to: { flaps: [{l:"Config 1+F",f:1.0}, {l:"Config 2",f:0.94}], bVr: 122, mVr: 150 }, ldg: { flaps: [{l:"Config 3",f:1.05}, {l:"Config FULL",f:1.0}], bRef: 118, mRef: 142 } },
  "A320": { name: "Airbus A320-200", type: "narrow", empty: 42600, max: 78000, group: "Airbus", to: { flaps: [{l:"Config 1+F",f:1.0}, {l:"Config 2",f:0.94}], bVr: 125, mVr: 155 }, ldg: { flaps: [{l:"Config 3",f:1.06}, {l:"Config FULL",f:1.0}], bRef: 122, mRef: 148 } },
  "A321": { name: "Airbus A321", type: "narrow", empty: 48500, max: 93500, group: "Airbus", to: { flaps: [{l:"Config 1+F",f:1.0}, {l:"Config 2",f:0.94}], bVr: 130, mVr: 165 }, ldg: { flaps: [{l:"Config 3",f:1.05}, {l:"Config FULL",f:1.0}], bRef: 128, mRef: 155 } },
  "A330-300": { name: "Airbus A330-300", type: "heavy", empty: 124500, max: 242000, group: "Airbus", to: { flaps: [{l:"Config 1+F",f:1.0}, {l:"Config 2",f:0.93}], bVr: 130, mVr: 165 }, ldg: { flaps: [{l:"Config 3",f:1.04}, {l:"Config FULL",f:1.0}], bRef: 130, mRef: 155 } },
  "A330-900": { name: "Airbus A330-900neo", type: "heavy", empty: 132000, max: 251000, group: "Airbus", to: { flaps: [{l:"Config 1+F",f:1.0}, {l:"Config 2",f:0.93}], bVr: 132, mVr: 168 }, ldg: { flaps: [{l:"Config 3",f:1.04}, {l:"Config FULL",f:1.0}], bRef: 132, mRef: 158 } },
  "A340-600": { name: "Airbus A340-600", type: "heavy", empty: 177800, max: 368000, group: "Airbus", to: { flaps: [{l:"Config 1+F",f:1.0}, {l:"Config 2",f:0.92}], bVr: 140, mVr: 175 }, ldg: { flaps: [{l:"Config 3",f:1.04}, {l:"Config FULL",f:1.0}], bRef: 138, mRef: 165 } },
  "A350-900": { name: "Airbus A350-900", type: "heavy", empty: 142000, max: 280000, group: "Airbus", to: { flaps: [{l:"Config 1+F",f:1.0}, {l:"Config 2",f:0.95}], bVr: 130, mVr: 165 }, ldg: { flaps: [{l:"Config 3",f:1.05}, {l:"Config FULL",f:1.0}], bRef: 128, mRef: 152 } },
  "A380-800": { name: "Airbus A380-800", type: "super", empty: 276800, max: 575000, group: "Airbus", to: { flaps: [{l:"Config 1+F",f:1.0}, {l:"Config 2",f:0.95}, {l:"Config 3",f:0.90}], bVr: 135, mVr: 170 }, ldg: { flaps: [{l:"Config 3",f:1.04}, {l:"Config FULL",f:1.0}], bRef: 130, mRef: 155 } },

  // --- BOEING ---
  "B717": { name: "Boeing 717-200", type: "narrow", empty: 30600, max: 54900, group: "Boeing", to: { flaps: [{l:"5°",f:1.0}, {l:"13°",f:0.92}], bVr: 120, mVr: 145 }, ldg: { flaps: [{l:"25°",f:1.05}, {l:"40°",f:1.0}], bRef: 118, mRef: 142 } },
  "B737-700": { name: "Boeing 737-700", type: "narrow", empty: 38100, max: 70000, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 10",f:0.96}, {l:"Flap 15",f:0.92}], bVr: 125, mVr: 150 }, ldg: { flaps: [{l:"Flap 30",f:1.0}, {l:"Flap 40",f:0.98}], bRef: 120, mRef: 148 } },
  "B737-800": { name: "Boeing 737-800", type: "narrow", empty: 41400, max: 79000, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 10",f:0.96}, {l:"Flap 15",f:0.92}], bVr: 128, mVr: 155 }, ldg: { flaps: [{l:"Flap 30",f:1.0}, {l:"Flap 40",f:0.98}], bRef: 125, mRef: 152 } },
  "B737-900": { name: "Boeing 737-900", type: "narrow", empty: 42600, max: 85100, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 10",f:0.96}, {l:"Flap 15",f:0.92}], bVr: 130, mVr: 160 }, ldg: { flaps: [{l:"Flap 30",f:1.0}, {l:"Flap 40",f:0.98}], bRef: 128, mRef: 158 } },
  "B737-MAX8": { name: "Boeing 737 MAX 8", type: "narrow", empty: 45000, max: 82200, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 10",f:0.96}, {l:"Flap 15",f:0.92}], bVr: 130, mVr: 160 }, ldg: { flaps: [{l:"Flap 30",f:1.0}, {l:"Flap 40",f:0.98}], bRef: 128, mRef: 155 } },
  "B747-400": { name: "Boeing 747-400", type: "heavy", empty: 178800, max: 396890, group: "Boeing", to: { flaps: [{l:"Flap 10",f:1.0}, {l:"Flap 20",f:0.92}], bVr: 145, mVr: 180 }, ldg: { flaps: [{l:"Flap 25",f:1.05}, {l:"Flap 30",f:1.0}], bRef: 140, mRef: 170 } },
  "B747-8": { name: "Boeing 747-8", type: "heavy", empty: 220100, max: 447700, group: "Boeing", to: { flaps: [{l:"Flap 10",f:1.0}, {l:"Flap 20",f:0.92}], bVr: 145, mVr: 185 }, ldg: { flaps: [{l:"Flap 25",f:1.05}, {l:"Flap 30",f:1.0}], bRef: 142, mRef: 175 } },
  "B757-200": { name: "Boeing 757-200", type: "narrow", empty: 57800, max: 115600, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 15",f:0.92}, {l:"Flap 20",f:0.88}], bVr: 120, mVr: 155 }, ldg: { flaps: [{l:"Flap 25",f:1.05}, {l:"Flap 30",f:1.0}], bRef: 118, mRef: 145 } },
  "B767-300": { name: "Boeing 767-300ER", type: "heavy", empty: 90000, max: 186880, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 15",f:0.92}], bVr: 130, mVr: 165 }, ldg: { flaps: [{l:"Flap 25",f:1.05}, {l:"Flap 30",f:1.0}], bRef: 130, mRef: 155 } },
  "B777-200ER": { name: "Boeing 777-200ER", type: "heavy", empty: 138100, max: 297550, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 15",f:0.92}], bVr: 135, mVr: 175 }, ldg: { flaps: [{l:"Flap 25",f:1.05}, {l:"Flap 30",f:1.0}], bRef: 130, mRef: 158 } },
  "B777-200LR": { name: "Boeing 777-200LR", type: "heavy", empty: 145150, max: 347500, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 15",f:0.92}], bVr: 138, mVr: 180 }, ldg: { flaps: [{l:"Flap 25",f:1.05}, {l:"Flap 30",f:1.0}], bRef: 132, mRef: 162 } },
  "B777-300ER": { name: "Boeing 777-300ER", type: "heavy", empty: 167800, max: 351500, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 15",f:0.92}, {l:"Flap 20",f:0.88}], bVr: 135, mVr: 185 }, ldg: { flaps: [{l:"Flap 25",f:1.05}, {l:"Flap 30",f:1.0}], bRef: 128, mRef: 160 } },
  "B777F": { name: "Boeing 777F", type: "heavy", empty: 144400, max: 347800, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 15",f:0.92}], bVr: 135, mVr: 180 }, ldg: { flaps: [{l:"Flap 25",f:1.05}, {l:"Flap 30",f:1.0}], bRef: 130, mRef: 160 } },
  "B787-8": { name: "Boeing 787-8", type: "heavy", empty: 119950, max: 227900, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 15",f:0.92}], bVr: 130, mVr: 165 }, ldg: { flaps: [{l:"Flap 25",f:1.05}, {l:"Flap 30",f:1.0}], bRef: 128, mRef: 155 } },
  "B787-9": { name: "Boeing 787-9", type: "heavy", empty: 128850, max: 254000, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 15",f:0.92}], bVr: 132, mVr: 170 }, ldg: { flaps: [{l:"Flap 25",f:1.05}, {l:"Flap 30",f:1.0}], bRef: 130, mRef: 158 } },
  "B787-10": { name: "Boeing 787-10", type: "heavy", empty: 135500, max: 254000, group: "Boeing", to: { flaps: [{l:"Flap 5",f:1.0}, {l:"Flap 15",f:0.92}], bVr: 135, mVr: 175 }, ldg: { flaps: [{l:"Flap 25",f:1.05}, {l:"Flap 30",f:1.0}], bRef: 132, mRef: 160 } },

  // --- REGIONAL & OUTROS ---
  "CRJ-200": { name: "Bombardier CRJ-200", type: "regional", empty: 13700, max: 24000, group: "Regional/Outros", to: { flaps: [{l:"8°",f:1.0}, {l:"20°",f:0.92}], bVr: 125, mVr: 145 }, ldg: { flaps: [{l:"45°",f:1.0}], bRef: 120, mRef: 142 } },
  "CRJ-700": { name: "Bombardier CRJ-700", type: "regional", empty: 19700, max: 34000, group: "Regional/Outros", to: { flaps: [{l:"8°",f:1.0}, {l:"20°",f:0.92}], bVr: 128, mVr: 150 }, ldg: { flaps: [{l:"45°",f:1.0}], bRef: 125, mRef: 145 } },
  "CRJ-900": { name: "Bombardier CRJ-900", type: "regional", empty: 21400, max: 38300, group: "Regional/Outros", to: { flaps: [{l:"8°",f:1.0}, {l:"20°",f:0.92}], bVr: 130, mVr: 155 }, ldg: { flaps: [{l:"45°",f:1.0}], bRef: 128, mRef: 148 } },
  "E175": { name: "Embraer E175", type: "regional", empty: 21800, max: 40370, group: "Regional/Outros", to: { flaps: [{l:"Flap 1",f:1.0}, {l:"Flap 2",f:0.94}], bVr: 125, mVr: 150 }, ldg: { flaps: [{l:"Flap 5",f:1.05}, {l:"Flap Full",f:1.0}], bRef: 120, mRef: 142 } },
  "E190": { name: "Embraer E190", type: "regional", empty: 28000, max: 51800, group: "Regional/Outros", to: { flaps: [{l:"Flap 1",f:1.0}, {l:"Flap 2",f:0.94}], bVr: 128, mVr: 155 }, ldg: { flaps: [{l:"Flap 5",f:1.05}, {l:"Flap Full",f:1.0}], bRef: 125, mRef: 145 } },
  "Q400": { name: "Dash 8 Q400", type: "prop", empty: 17100, max: 29500, group: "Regional/Outros", to: { flaps: [{l:"5°",f:1.0}, {l:"10°",f:0.92}, {l:"15°",f:0.88}], bVr: 110, mVr: 135 }, ldg: { flaps: [{l:"15°",f:1.05}, {l:"35°",f:1.0}], bRef: 115, mRef: 135 } },
  "MD-11": { name: "McDonnell Douglas MD-11/F", type: "heavy", empty: 128800, max: 286000, group: "Regional/Outros", to: { flaps: [{l:"15°",f:1.0}, {l:"28°",f:0.92}], bVr: 145, mVr: 180 }, ldg: { flaps: [{l:"35°",f:1.05}, {l:"50°",f:1.0}], bRef: 142, mRef: 168 } },
  "DC-10": { name: "McDonnell Douglas DC-10/F", type: "heavy", empty: 121000, max: 259000, group: "Regional/Outros", to: { flaps: [{l:"15°",f:1.0}, {l:"22°",f:0.92}], bVr: 145, mVr: 180 }, ldg: { flaps: [{l:"35°",f:1.05}, {l:"50°",f:1.0}], bRef: 140, mRef: 165 } },

  // --- AVIAÇÃO GERAL ---
  "C172": { name: "Cessna 172 Skyhawk", type: "ga", empty: 767, max: 1157, group: "Aviação Geral", to: { flaps: [{l:"0°",f:1.0}, {l:"10°",f:0.90}], bVr: 55, mVr: 65 }, ldg: { flaps: [{l:"30°",f:1.0}, {l:"20°",f:1.05}], bRef: 60, mRef: 70 } },
  "C208": { name: "Cessna 208 Caravan", type: "ga", empty: 2100, max: 3900, group: "Aviação Geral", to: { flaps: [{l:"0°",f:1.0}, {l:"20°",f:0.90}], bVr: 70, mVr: 90 }, ldg: { flaps: [{l:"Full",f:1.0}], bRef: 75, mRef: 95 } },
  "SR22": { name: "Cirrus SR22", type: "ga", empty: 1009, max: 1542, group: "Aviação Geral", to: { flaps: [{l:"0%",f:1.0}, {l:"50%",f:0.90}], bVr: 70, mVr: 85 }, ldg: { flaps: [{l:"100%",f:1.0}], bRef: 75, mRef: 90 } },
  "TBM930": { name: "Daher TBM-930", type: "ga", empty: 2097, max: 3354, group: "Aviação Geral", to: { flaps: [{l:"Takeoff",f:1.0}], bVr: 85, mVr: 100 }, ldg: { flaps: [{l:"Landing",f:1.0}], bRef: 80, mRef: 95 } },
  "XCub": { name: "CubCrafters XCub", type: "ga", empty: 550, max: 1043, group: "Aviação Geral", to: { flaps: [{l:"15°",f:1.0}], bVr: 40, mVr: 55 }, ldg: { flaps: [{l:"Full",f:1.0}], bRef: 45, mRef: 60 } },
  "CL350": { name: "Challenger 350", type: "ga", empty: 11200, max: 18400, group: "Aviação Geral", to: { flaps: [{l:"10°",f:1.0}, {l:"20°",f:0.92}], bVr: 115, mVr: 135 }, ldg: { flaps: [{l:"30°",f:1.0}], bRef: 118, mRef: 138 } },

  // --- MILITAR ---
  "F16": { name: "F-16C Viper", type: "fighter", empty: 9200, max: 19180, group: "Militar", to: { flaps: [{l:"Auto",f:1.0}], bVr: 130, mVr: 170 }, ldg: { flaps: [{l:"Auto",f:1.0}], bRef: 130, mRef: 160 } },
  "F18": { name: "F/A-18E Super Hornet", type: "fighter", empty: 14550, max: 29900, group: "Militar", to: { flaps: [{l:"Half",f:1.0}, {l:"Full",f:0.90}], bVr: 130, mVr: 175 }, ldg: { flaps: [{l:"Full",f:1.0}, {l:"Half",f:1.1}], bRef: 135, mRef: 165 } },
  "F22": { name: "F-22 Raptor", type: "fighter", empty: 19700, max: 38000, group: "Militar", to: { flaps: [{l:"Auto",f:1.0}], bVr: 120, mVr: 160 }, ldg: { flaps: [{l:"Auto",f:1.0}], bRef: 125, mRef: 155 } },
  "A10": { name: "A-10 Thunderbolt II", type: "fighter", empty: 11300, max: 22700, group: "Militar", to: { flaps: [{l:"7°",f:1.0}, {l:"20°",f:0.92}], bVr: 120, mVr: 150 }, ldg: { flaps: [{l:"20°",f:1.0}], bRef: 125, mRef: 145 } },
  "C130": { name: "C-130 Hercules", type: "mil_transport", empty: 34400, max: 70300, group: "Militar", to: { flaps: [{l:"50%",f:1.0}], bVr: 100, mVr: 135 }, ldg: { flaps: [{l:"100%",f:1.0}], bRef: 110, mRef: 140 } },
  "C17": { name: "C-17 Globemaster", type: "mil_transport", empty: 128100, max: 265350, group: "Militar", to: { flaps: [{l:"2/3",f:1.0}], bVr: 115, mVr: 155 }, ldg: { flaps: [{l:"Full",f:1.0}], bRef: 120, mRef: 150 } },
  "SPIT": { name: "Spitfire Mk VIII", type: "warbird", empty: 2300, max: 3600, group: "Militar", to: { flaps: [{l:"Up",f:1.0}], bVr: 85, mVr: 100 }, ldg: { flaps: [{l:"Down",f:1.0}], bRef: 85, mRef: 100 } },
  "P38": { name: "P-38 Lightning", type: "warbird", empty: 5800, max: 9790, group: "Militar", to: { flaps: [{l:"Maneuver",f:1.0}], bVr: 90, mVr: 110 }, ldg: { flaps: [{l:"Full",f:1.0}], bRef: 95, mRef: 115 } }
};

export const getAircraftList = (): [string, Aircraft][] => {
  return Object.entries(AIRCRAFT_DB);
};

export const getAircraftByGroup = (): Record<string, [string, Aircraft][]> => {
  const grouped: Record<string, [string, Aircraft][]> = {};
  
  Object.entries(AIRCRAFT_DB).forEach(([id, aircraft]) => {
    if (!grouped[aircraft.group]) {
      grouped[aircraft.group] = [];
    }
    grouped[aircraft.group].push([id, aircraft]);
  });
  
  return grouped;
};
