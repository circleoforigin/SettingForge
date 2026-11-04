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
            daylightMinutes: 574,
        },

        longSolstice: {
            monthId: 'june',
            day: 21,
            daylightMinutes: 886,
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

    moons: [
      {
        id: 'moon',
        name: 'Moon',

        // Approximately 24 hours, 50 minutes.
        lunarDay: 89400,
        moonriseOffset: 0,

        phaseCycles: [
          {
            id: 'lunar-phases',
            name: 'Lunar Phases',

            structure: '{Direction} {Phase}',

            // Approximately one synodic month.
            cycleDuration: 2551443,
            cycleOffset: 0,

            tags: [
              {
                id: 'direction',
                name: 'Direction',
                progressionStyle: 'loop',

                entries: [
                  {
                    id: 'direction-none-new',
                    name: '',
                    phaseDuration: 1,
                  },
                  {
                    id: 'direction-waxing',
                    name: 'Waxing',
                    phaseDuration: 3,
                  },
                  {
                    id: 'direction-none-full',
                    name: '',
                    phaseDuration: 1,
                  },
                  {
                    id: 'direction-waning',
                    name: 'Waning',
                    phaseDuration: 3,
                  },
                ],
              },
              {
                id: 'phase',
                name: 'Phase',
                progressionStyle: 'loop',

                entries: [
                  {
                    id: 'phase-new',
                    name: 'New Moon',
                    phaseDuration: 1,
                  },
                  {
                    id: 'phase-waxing-crescent',
                    name: 'Crescent',
                    phaseDuration: 1,
                  },
                  {
                    id: 'phase-first-quarter',
                    name: 'First Quarter',
                    phaseDuration: 1,
                  },
                  {
                    id: 'phase-waxing-gibbous',
                    name: 'Gibbous',
                    phaseDuration: 1,
                  },
                  {
                    id: 'phase-full',
                    name: 'Full Moon',
                    phaseDuration: 1,
                  },
                  {
                    id: 'phase-waning-gibbous',
                    name: 'Gibbous',
                    phaseDuration: 1,
                  },
                  {
                    id: 'phase-last-quarter',
                    name: 'Last Quarter',
                    phaseDuration: 1,
                  },
                  {
                    id: 'phase-waning-crescent',
                    name: 'Crescent',
                    phaseDuration: 1,
                  },
                ],
              },
            ],

            notables: [
              {
                id: 'new-moon',
                name: 'New Moon',
                conditions: [
                  {
                    tagId: 'phase',
                    value: 'New Moon',
                  },
                ],
              },
              {
                id: 'full-moon',
                name: 'Full Moon',
                conditions: [
                  {
                    tagId: 'phase',
                    value: 'Full Moon',
                  },
                ],
              },
            ],
          },
        ],
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