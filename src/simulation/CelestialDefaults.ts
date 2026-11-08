import type { CelestialSettings } from './CelestialSettings';
import type { CelestialEclipseGenerationOptions } from './CelestialPositionResolver';

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

eclipseSettings: {
  newPhase: {
    cycleId: 'lunar-phases',
    tagId: 'phase',
    entryId: 'phase-new',
  },
  fullPhase: {
    cycleId: 'lunar-phases',
    tagId: 'phase',
    entryId: 'phase-full',
  },
},
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
          },
        ],
      },
    ],
    conjunctions: [
  ...([
    ['solar-partial', 'Partial Solar Eclipse', 'daytime', 'phase-new'],
    ['solar-annular', 'Annular Solar Eclipse', 'daytime', 'phase-new'],
    ['solar-total', 'Total Solar Eclipse', 'daytime', 'phase-new'],
    ['lunar-penumbral', 'Penumbral Lunar Eclipse', 'nighttime', 'phase-full'],
    ['lunar-partial', 'Partial Lunar Eclipse', 'nighttime', 'phase-full'],
    ['lunar-total', 'Total Lunar Eclipse', 'nighttime', 'phase-full'],
  ] as const).map(([type, name, solarPhase, entryId]) => ({
    id: `moon:${type}`,
    name,
    type,
    conditions: [
      {
        bodyId: 'sun',
        solarPhase,
      },
      {
        bodyId: 'moon',
        cycleId: 'lunar-phases',
        tagId: 'phase',
        entryId,
      },
    ],
  })),
],
notables: [
  {
    id: 'moon:lunar-phases:new-moon',
    name: 'New Moon',
    conditions: [
      {
        bodyId: 'moon',
        cycleId: 'lunar-phases',
        tagId: 'phase',
        value: 'New Moon',
      },
    ],
  },
  {
    id: 'moon:lunar-phases:full-moon',
    name: 'Full Moon',
    conditions: [
      {
        bodyId: 'moon',
        cycleId: 'lunar-phases',
        tagId: 'phase',
        value: 'Full Moon',
      },
    ],
  },
  
...[
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
].map(sign => ({
  id: `western-zodiac:western-zodiac-signs:${sign.toLowerCase()}`,
  name: sign,
  conditions: [
    {
      bodyId: 'western-zodiac',
      cycleId: 'western-zodiac-signs',
      tagId: 'zodiac-sign',
      value: sign,
    },
  ],
})),

],

  };


export const DEFAULT_ECLIPSE_OPTIONS:
  CelestialEclipseGenerationOptions = {
    worldSeed: 'settingforge',
    eclipseChance: 0.08,

    solarWeights: {
      partial: 60,
      annular: 15,
      total: 25,
    },

    lunarWeights: {
      penumbral: 35,
      partial: 40,
      total: 25,
    },

    durations: {
      'solar-partial': {
        minimum: 3600,
        maximum: 10800,
      },
      'solar-annular': {
        minimum: 7200,
        maximum: 14400,
        centralMinimum: 120,
        centralMaximum: 600,
      },
      'solar-total': {
        minimum: 7200,
        maximum: 14400,
        centralMinimum: 60,
        centralMaximum: 420,
      },
      'lunar-penumbral': {
        minimum: 3600,
        maximum: 10800,
      },
      'lunar-partial': {
        minimum: 5400,
        maximum: 14400,
      },
      'lunar-total': {
        minimum: 10800,
        maximum: 21600,
        centralMinimum: 1800,
        centralMaximum: 5400,
      },
    },
  };


export function createDefaultCelestialSettings():
  CelestialSettings
{
  return structuredClone(
    DEFAULT_CELESTIAL_SETTINGS
  );
}