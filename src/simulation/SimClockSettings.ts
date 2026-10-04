export interface SimClockMonth
{
  id: string;
  name: string;
  days: number;
}

export interface SimClockLeapRule
{
  interval: number;
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

export interface SimClockSettings
{
  eras: SimClockEra[];
  activeEraId: string;
}

export const DEFAULT_SIM_CLOCK_SETTINGS: SimClockSettings = {
  activeEraId: 'common-era',

  eras: [
    {
      id: 'common-era',
      name: 'Common Era',
      abbreviation: 'CE',

      secondsPerMinute: 60,
      minutesPerHour: 60,
      hoursPerDay: 24,

      dayNames: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],

      months: [
        { id: 'january', name: 'January', days: 31 },
        { id: 'february', name: 'February', days: 28 },
        { id: 'march', name: 'March', days: 31 },
        { id: 'april', name: 'April', days: 30 },
        { id: 'may', name: 'May', days: 31 },
        { id: 'june', name: 'June', days: 30 },
        { id: 'july', name: 'July', days: 31 },
        { id: 'august', name: 'August', days: 31 },
        { id: 'september', name: 'September', days: 30 },
        { id: 'october', name: 'October', days: 31 },
        { id: 'november', name: 'November', days: 30 },
        { id: 'december', name: 'December', days: 31 },
      ],

      leapRule: {
        interval: 4,
        monthId: 'february',
        afterDay: 28,
        additionalDays: 1,
      },

      startingWeekday: 'Monday',

      dateFormat: '{monthName} {day#}, {year} {era}',
    },
  ],
};

export function createDefaultSimClockSettings(): SimClockSettings
{
  return structuredClone(
    DEFAULT_SIM_CLOCK_SETTINGS
  );
}