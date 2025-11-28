export interface MetarData {
  raw: string;
  windDirection: number;
  windSpeed: number;
  temperature: number;
  station: string;
}

export async function fetchMetar(icao: string): Promise<MetarData | null> {
  try {
    const response = await fetch(`https://metar.vatsim.net/metar.php?id=${icao.toUpperCase()}`);
    const text = await response.text();
    
    if (!text || text.includes('No METAR')) {
      return null;
    }
    
    return parseMetar(text, icao);
  } catch (error) {
    console.error('Error fetching METAR:', error);
    return null;
  }
}

export function parseMetar(rawMetar: string, station: string): MetarData | null {
  try {
    // Parse wind (e.g., 27015KT or 09008G15KT)
    const windMatch = rawMetar.match(/(\d{3})(\d{2,3})(G\d{2,3})?KT/);
    const windDirection = windMatch ? parseInt(windMatch[1]) : 0;
    const windSpeed = windMatch ? parseInt(windMatch[2]) : 0;
    
    // Parse temperature (e.g., 24/18 or M02/M05)
    const tempMatch = rawMetar.match(/(M?\d{2})\/(M?\d{2})/);
    let temperature = 15; // Default to 15°C
    
    if (tempMatch) {
      const tempStr = tempMatch[1];
      temperature = parseInt(tempStr.replace('M', '-'));
    }
    
    return {
      raw: rawMetar,
      windDirection,
      windSpeed,
      temperature,
      station,
    };
  } catch (error) {
    console.error('Error parsing METAR:', error);
    return null;
  }
}
