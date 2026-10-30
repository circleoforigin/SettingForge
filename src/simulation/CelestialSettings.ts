export interface CelestialSeasonStart
{
  seasonId: string;
  monthId: string;
  day: number;
}

export interface CelestialSun
{
  id: string;
  name: string;
}

export interface CelestialSolarCycle
{
  summerSolstice: {
    monthId: string;
    day: number;
  };

  winterSolstice: {
    monthId: string;
    day: number;
  };

  longestDayHours: number;
  shortestDayHours: number;
  solarNoonHour: number;
}

export interface CelestialSettings
{
  sun: CelestialSun;
  solarCycle: CelestialSolarCycle;
  seasonStarts: CelestialSeasonStart[];
}

export {
  DEFAULT_CELESTIAL_SETTINGS,
  createDefaultCelestialSettings,
} from './CelestialDefaults';