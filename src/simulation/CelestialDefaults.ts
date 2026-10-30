import type {
  CelestialSettings,
} from './CelestialSettings';

export const DEFAULT_CELESTIAL_SETTINGS:
  CelestialSettings = {
    sun: {
      id: 'sun',
      name: 'Sun',
    },

    solarCycle: {
      summerSolstice: {
        monthId: 'june',
        day: 21,
      },

      winterSolstice: {
        monthId: 'december',
        day: 21,
      },

      longestDayHours: 15,
      shortestDayHours: 9,

      solarNoonHour: 12,
    },

    seasonStarts: [
      {
        seasonId: 'spring',
        monthId: 'march',
        day: 20,
      },
      {
        seasonId: 'summer',
        monthId: 'june',
        day: 21,
      },
      {
        seasonId: 'autumn',
        monthId: 'september',
        day: 22,
      },
      {
        seasonId: 'winter',
        monthId: 'december',
        day: 21,
      },
    ],
  };

export function createDefaultCelestialSettings():
  CelestialSettings
{
  return structuredClone(
    DEFAULT_CELESTIAL_SETTINGS
  );
}