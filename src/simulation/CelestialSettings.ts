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
    daylightMinutes: number;
  };

  longSolstice: {
    monthId: string;
    day: number;
    daylightMinutes: number;
  };
}

export type CelestialProgressionStyle =
  | 'loop'
  | 'peak'
  | 'wave';

export type CelestialTagEntry = CelestialPhaseTagEntry;
export type CelestialTag = CelestialPhaseTag;
export type CelestialCycle = CelestialPhaseCycle;

export interface CelestialPhaseTagEntry
{
  id: string;
  name: string;

  // Number of phase steps this entry occupies.
  phaseDuration: number;
}

export interface CelestialPhaseTag
{
  id: string;
  name: string;
  progressionStyle: CelestialProgressionStyle;
  entries: CelestialPhaseTagEntry[];
}

export interface CelestialNotableCondition
{
  tagId: string;
  value: string;
}

export interface CelestialNotable
{
  id: string;
  name: string;
  conditions: CelestialNotableCondition[];
}

export interface CelestialPhaseCycle
{
  id: string;
  name: string;

  // Example: "{Direction} {Phase}"
  structure: string;

  // Simulation-time durations.
  cycleDuration: number;
  cycleOffset: number;

  tags: CelestialPhaseTag[];
  notables: CelestialNotable[];
}

export interface CelestialMoon
{
  id: string;
  name: string;

  // Simulation-time durations.
  lunarDay: number;
  moonriseOffset: number;

  phaseCycles: CelestialPhaseCycle[];
}

export interface CelestialSettings
{
  sun: CelestialSun;
  solarCycle: CelestialSolarCycle;
  seasonStarts: CelestialSeasonStart[];

  moons: CelestialMoon[];
}

export {
  DEFAULT_CELESTIAL_SETTINGS,
  createDefaultCelestialSettings,
} from './CelestialDefaults';