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
  type: 'narrow' | 'heavy' | 'super' | 'ga' | 'fighter';
  empty: number;
  max: number;
  group: string;
  to: AircraftPhase; // takeoff
  ldg: AircraftPhase; // landing
}

export const AIRCRAFT_DB: Record<string, Aircraft> = {
  "A220-300": {
    name: "Airbus A220-300",
    type: "narrow",
    empty: 37000,
    max: 69900,
    group: "Airbus",
    to: {
      flaps: [
        { l: "Config 1", f: 1.0 },
        { l: "Config 2", f: 0.95 }
      ],
      bVr: 125,
      mVr: 150
    },
    ldg: {
      flaps: [
        { l: "Config 3", f: 1.04 },
        { l: "Config FULL", f: 1.0 }
      ],
      bRef: 120,
      mRef: 145
    }
  },
  "A320": {
    name: "Airbus A320-200",
    type: "narrow",
    empty: 42600,
    max: 78000,
    group: "Airbus",
    to: {
      flaps: [
        { l: "Config 1+F", f: 1.0 },
        { l: "Config 2", f: 0.94 }
      ],
      bVr: 125,
      mVr: 155
    },
    ldg: {
      flaps: [
        { l: "Config 3", f: 1.06 },
        { l: "Config FULL", f: 1.0 }
      ],
      bRef: 122,
      mRef: 148
    }
  },
  "A330-300": {
    name: "Airbus A330-300",
    type: "heavy",
    empty: 124500,
    max: 242000,
    group: "Airbus",
    to: {
      flaps: [
        { l: "Config 1+F", f: 1.0 },
        { l: "Config 2", f: 0.93 }
      ],
      bVr: 130,
      mVr: 165
    },
    ldg: {
      flaps: [
        { l: "Config 3", f: 1.04 },
        { l: "Config FULL", f: 1.0 }
      ],
      bRef: 130,
      mRef: 155
    }
  },
  "A350-900": {
    name: "Airbus A350-900",
    type: "heavy",
    empty: 142000,
    max: 280000,
    group: "Airbus",
    to: {
      flaps: [
        { l: "Config 1+F", f: 1.0 },
        { l: "Config 2", f: 0.95 }
      ],
      bVr: 130,
      mVr: 165
    },
    ldg: {
      flaps: [
        { l: "Config 3", f: 1.05 },
        { l: "Config FULL", f: 1.0 }
      ],
      bRef: 128,
      mRef: 152
    }
  },
  "A380-800": {
    name: "Airbus A380-800",
    type: "super",
    empty: 276800,
    max: 575000,
    group: "Airbus",
    to: {
      flaps: [
        { l: "Config 1+F", f: 1.0 },
        { l: "Config 2", f: 0.95 },
        { l: "Config 3", f: 0.90 }
      ],
      bVr: 135,
      mVr: 170
    },
    ldg: {
      flaps: [
        { l: "Config 3", f: 1.04 },
        { l: "Config FULL", f: 1.0 }
      ],
      bRef: 130,
      mRef: 155
    }
  },
  "B737-800": {
    name: "Boeing 737-800",
    type: "narrow",
    empty: 41400,
    max: 79000,
    group: "Boeing",
    to: {
      flaps: [
        { l: "Flap 5", f: 1.0 },
        { l: "Flap 10", f: 0.96 },
        { l: "Flap 15", f: 0.92 }
      ],
      bVr: 128,
      mVr: 155
    },
    ldg: {
      flaps: [
        { l: "Flap 30", f: 1.0 },
        { l: "Flap 40", f: 0.98 }
      ],
      bRef: 125,
      mRef: 152
    }
  },
  "B777-300ER": {
    name: "Boeing 777-300ER",
    type: "heavy",
    empty: 167800,
    max: 351500,
    group: "Boeing",
    to: {
      flaps: [
        { l: "Flap 5", f: 1.0 },
        { l: "Flap 15", f: 0.92 },
        { l: "Flap 20", f: 0.88 }
      ],
      bVr: 135,
      mVr: 185
    },
    ldg: {
      flaps: [
        { l: "Flap 25", f: 1.05 },
        { l: "Flap 30", f: 1.0 }
      ],
      bRef: 128,
      mRef: 160
    }
  },
  "B787-9": {
    name: "Boeing 787-9",
    type: "heavy",
    empty: 128850,
    max: 254000,
    group: "Boeing",
    to: {
      flaps: [
        { l: "Flap 5", f: 1.0 },
        { l: "Flap 15", f: 0.92 }
      ],
      bVr: 132,
      mVr: 170
    },
    ldg: {
      flaps: [
        { l: "Flap 25", f: 1.05 },
        { l: "Flap 30", f: 1.0 }
      ],
      bRef: 130,
      mRef: 158
    }
  },
  "C172": {
    name: "Cessna 172 Skyhawk",
    type: "ga",
    empty: 767,
    max: 1157,
    group: "Gen Av",
    to: {
      flaps: [
        { l: "0°", f: 1.0 },
        { l: "10°", f: 0.90 }
      ],
      bVr: 55,
      mVr: 65
    },
    ldg: {
      flaps: [
        { l: "30°", f: 1.0 },
        { l: "20°", f: 1.05 }
      ],
      bRef: 60,
      mRef: 70
    }
  },
  "F22": {
    name: "F-22 Raptor",
    type: "fighter",
    empty: 19700,
    max: 38000,
    group: "Militar",
    to: {
      flaps: [{ l: "Auto", f: 1.0 }],
      bVr: 120,
      mVr: 160
    },
    ldg: {
      flaps: [{ l: "Auto", f: 1.0 }],
      bRef: 125,
      mRef: 155
    }
  }
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
