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
        shortSolstice: {
            monthId: 'december',
            day: 21,
            daylightMinutes: 553,
        },

        longSolstice: {
            monthId: 'june',
            day: 21,
            daylightMinutes: 921,
        },
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