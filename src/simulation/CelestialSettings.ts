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

export type CelestialCycleMeasurement =
  | 'duration'
  | 'calendar';

export type CelestialTagEntry = CelestialPhaseTagEntry;
export type CelestialTag = CelestialPhaseTag;
export type CelestialCycle = CelestialPhaseCycle;

export interface CelestialPhaseTagEntry
{
  id: string;
  name: string;

  // Used by duration-based cycles.
  // Number of progression steps this entry occupies.
  phaseDuration: number;

  // Used by calendar-based cycles.
  // References the configured calendar's month.
  startMonthId?: string;
  startDay?: number;
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
  bodyId: string;
  cycleId: string;
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

  // Determines how progression is measured.
  // Omitted in older settings means 'duration'.
  cycleMeasurement?: CelestialCycleMeasurement;

  // Duration mode: complete cycle length.
  // Calendar mode: yearly, derived from the calendar.
  cycleDuration: number;

  // Duration mode: starting progression offset.
  // Calendar mode: time of day for date transitions.
  cycleOffset: number;

  tags: CelestialPhaseTag[];

  // Legacy data only. Existing saved Worlds
  // may still contain cycle-owned Notables.
  notables?: {
    id: string;
    name: string;
    conditions: {
      tagId: string;
      value: string;
    }[];
  }[];
}

export interface CelestialEclipsePhaseReference {
  cycleId: string;
  tagId: string;
  entryId: string;
}

export interface CelestialMoonEclipseSettings {
  newPhase?: CelestialEclipsePhaseReference;
  fullPhase?: CelestialEclipsePhaseReference;
}

export interface CelestialMoon
{
  id: string;
  name: string;

  // Simulation-time durations.
  lunarDay: number;
  moonriseOffset: number;

  phaseCycles: CelestialPhaseCycle[];
  eclipseSettings?: CelestialMoonEclipseSettings;
}

export interface CelestialZodiac
{
  id: string;
  name: string;

  zodiacDay: number;
  zodiacRiseOffset: number;

  cycles: CelestialCycle[];
}

export type CelestialConjunctionType =
  | 'solar-partial'
  | 'solar-annular'
  | 'solar-total'
  | 'lunar-penumbral'
  | 'lunar-partial'
  | 'lunar-total';

export interface CelestialConjunction {
  id: string;
  name: string;
  type: CelestialConjunctionType;

  moonId: string;
  sunPhase: 'daytime' | 'nighttime';
  moonPhase: CelestialEclipsePhaseReference;
}

export interface CelestialSettings
{
  sun: CelestialSun;
  solarCycle: CelestialSolarCycle;
  seasonStarts: CelestialSeasonStart[];

  moons: CelestialMoon[];
  zodiacs: CelestialZodiac[];

  notables: CelestialNotable[];
  conjunctions: CelestialConjunction[];
}

export {
  DEFAULT_CELESTIAL_SETTINGS,
  createDefaultCelestialSettings,
} from './CelestialDefaults';