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
  shortSolstice: {
    monthId: string;
    day: number;
    daylightHours: number;
  };

  longSolstice: {
    monthId: string;
    day: number;
    daylightHours: number;
  };
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