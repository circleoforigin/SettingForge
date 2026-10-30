export interface SimClockMonth
{
  id: string;
  name: string;
  days: number;
}

export interface SimClockLeapRule
{
  interval: number;
  exceptEvery?: number;
  unlessEvery?: number;

  monthId: string;
  afterDay: number;
  additionalDays: number;
}

export interface SimClockEra
{
  id: string;
  name: string;
  abbreviation: string;

  secondsPerMinute: number;
  minutesPerHour: number;
  hoursPerDay: number;

  dayNames: string[];
  months: SimClockMonth[];
  leapRule?: SimClockLeapRule;

  startingWeekday: string;

  dateFormat: string;
}

export type SimClockProgressUnit =
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years';

export type SimClockMarker =
  | 'sunrise'
  | 'noon'
  | 'sunset'
  | 'midnight';

export interface SimClockProgressPreset
{
  name: string;
  amount: number;
  unit: SimClockProgressUnit;
}

export interface SimClockMarkers
{
  sunriseHour: number;
  noonHour: number;
  sunsetHour: number;
  midnightHour: number;
}

export interface SimClockSettings
{
  eras: SimClockEra[];
  activeEraId: string;

  progressPresets: SimClockProgressPreset[];
  markers: SimClockMarkers;
}

export {
  DEFAULT_SIM_CLOCK_SETTINGS,
  createDefaultSimClockSettings,
} from './SimClockDefaults';