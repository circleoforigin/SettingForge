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
        name: 'Luna',

        // Approximately 24 hours, 50 minutes.
        lunarDay: 89428,
        // Estimated moonrise in Wichita, Kansas,
        // January 1, AD 1 (Julian calendar).
        // Approximately 9:02 PM local mean solar time.
        moonriseOffset: 45581,

        phaseCycles: [
          {
            id: 'lunar-phases',
            name: 'Lunar Phases',

            structure: '{Direction} {Phase}',

            // Approximately one synodic month.
            cycleDuration: 2551443,
            cycleOffset: 1551531,

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
    zodiacs: [
      {
        id: 'western-zodiac',
        name: 'Western Zodiac',

        // Stationary: no daily rise cycle.
        zodiacDay: 0,
        zodiacRiseOffset: 0,

        cycles: [
          {
            id: 'western-zodiac-signs',
            name: 'Zodiac Signs',

            structure: '{Sign}',

            cycleMeasurement: 'calendar',
            cycleDuration: 0,
            cycleOffset: 0,

            tags: [
              {
                id: 'zodiac-sign',
                name: 'Sign',
                progressionStyle: 'loop',

                entries: [
                  {
                    id: 'aries',
                    name: 'Aries',
                    phaseDuration: 1,
                    startMonthId: 'march',
                    startDay: 21,
                  },
                  {
                    id: 'taurus',
                    name: 'Taurus',
                    phaseDuration: 1,
                    startMonthId: 'april',
                    startDay: 20,
                  },
                  {
                    id: 'gemini',
                    name: 'Gemini',
                    phaseDuration: 1,
                    startMonthId: 'may',
                    startDay: 21,
                  },
                  {
                    id: 'cancer',
                    name: 'Cancer',
                    phaseDuration: 1,
                    startMonthId: 'june',
                    startDay: 21,
                  },
                  {
                    id: 'leo',
                    name: 'Leo',
                    phaseDuration: 1,
                    startMonthId: 'july',
                    startDay: 23,
                  },
                  {
                    id: 'virgo',
                    name: 'Virgo',
                    phaseDuration: 1,
                    startMonthId: 'august',
                    startDay: 23,
                  },
                  {
                    id: 'libra',
                    name: 'Libra',
                    phaseDuration: 1,
                    startMonthId: 'september',
                    startDay: 23,
                  },
                  {
                    id: 'scorpio',
                    name: 'Scorpio',
                    phaseDuration: 1,
                    startMonthId: 'october',
                    startDay: 23,
                  },
                  {
                    id: 'sagittarius',
                    name: 'Sagittarius',
                    phaseDuration: 1,
                    startMonthId: 'november',
                    startDay: 22,
                  },
                  {
                    id: 'capricorn',
                    name: 'Capricorn',
                    phaseDuration: 1,
                    startMonthId: 'december',
                    startDay: 22,
                  },
                  {
                    id: 'aquarius',
                    name: 'Aquarius',
                    phaseDuration: 1,
                    startMonthId: 'january',
                    startDay: 20,
                  },
                  {
                    id: 'pisces',
                    name: 'Pisces',
                    phaseDuration: 1,
                    startMonthId: 'february',
                    startDay: 19,
                  },
                ],
              },
            ],

            notables: [],
          },
        ],
      },
    ],
    notables: [],
  };

export function createDefaultCelestialSettings():
  CelestialSettings
{
  return structuredClone(
    DEFAULT_CELESTIAL_SETTINGS
  );
}