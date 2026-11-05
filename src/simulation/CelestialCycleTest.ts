
import type {
  CelestialCycle,
} from './CelestialSettings';

import {
  advanceCelestialCycle,
  findCelestialCyclePeriod,
  resolveCelestialCycleStep,
  resolveCelestialCycleAtTime,
} from './CelestialCycleStepper';

import type {
  CelestialTagProgress,
} from './CelestialStructureResolver';

import {
  createDefaultCelestialSettings,
} from './CelestialSettings';

import {
  resolveLunarCycle,
} from './CelestialLunarResolver';

export function testCelestialCycle(
  cycle: CelestialCycle,
  steps: number
): void
{
  let progress: {
    tagId: string;
    step: number;
  }[] = [];

  for (
    let index = 0;
    index < steps;
    index++
  )
  {
    const result = advanceCelestialCycle(
      cycle,
      progress
    );

    console.log(
      `Day ${index + 1}: ${result.resolved.name}`
    );

    progress = result.progress;
  }
}


export const TEST_ZODIAC_CYCLE: CelestialCycle =
{
  id: 'test-zodiac',
  name: 'Test Zodiac',

  structure: '{Prefix} {Emblem}',

  cycleDuration: 160 * 86400,
  cycleOffset: 0,

  tags: [
    {
      id: 'altitude-up',
      name: 'AltitudeUp',
      progressionStyle: 'loop',
      entries: [
        { id: 'up-1', name: 'Cresting', phaseDuration: 1 },
        { id: 'up-2', name: 'Ascending', phaseDuration: 1 },
        { id: 'up-3', name: 'Aligning', phaseDuration: 1 },
        { id: 'up-4', name: 'Descending', phaseDuration: 1 },
        { id: 'up-5', name: 'Wasting', phaseDuration: 1 },
      ],
    },
    {
      id: 'altitude-down',
      name: 'AltitudeDown',
      progressionStyle: 'loop',
      entries: [
        { id: 'down-1', name: 'Wasting', phaseDuration: 1 },
        { id: 'down-2', name: 'Descending', phaseDuration: 1 },
        { id: 'down-3', name: 'Aligning', phaseDuration: 1 },
        { id: 'down-4', name: 'Ascending', phaseDuration: 1 },
        { id: 'down-5', name: 'Cresting', phaseDuration: 1 },
      ],
    },
    {
      id: 'station',
      name: 'Station',
      progressionStyle: 'peak',
      entries: [
        { id: 'regal', name: 'Regal', phaseDuration: 1 },
        { id: 'noble', name: 'Noble', phaseDuration: 5 },
        { id: 'dweller', name: 'Dweller', phaseDuration: 5 },
        { id: 'vagrant', name: 'Vagrant', phaseDuration: 5 },
        { id: 'feral', name: 'Feral', phaseDuration: 1 },
      ],
    },
    {
      id: 'mark',
      name: 'Mark',
      progressionStyle: 'loop',
      entries: [
        { id: 'star', name: 'Star', phaseDuration: 1 },
        { id: 'skull', name: 'Skull', phaseDuration: 1 },
        { id: 'flame', name: 'Flame', phaseDuration: 1 },
        { id: 'path', name: 'Path', phaseDuration: 1 },
        { id: 'seed', name: 'Seed', phaseDuration: 1 },
      ],
    },
    {
      id: 'aspect',
      name: 'Aspect',
      progressionStyle: 'loop',
      entries: [
        { id: 'staff', name: 'Staff', phaseDuration: 15 },
        { id: 'ankh', name: 'Ankh', phaseDuration: 15 },
        { id: 'plow', name: 'Plow', phaseDuration: 15 },
        { id: 'drum', name: 'Drum', phaseDuration: 15 },
        { id: 'wreath', name: 'Wreath', phaseDuration: 15 },
        { id: 'sextant', name: 'Sextant', phaseDuration: 15 },
        { id: 'blade', name: 'Blade', phaseDuration: 15 },
        { id: 'sheath', name: 'Sheath', phaseDuration: 15 },
        { id: 'vane', name: 'Vane', phaseDuration: 15 },
        { id: 'tome', name: 'Tome', phaseDuration: 15 },
      ],
    },
    {
      id: 'prefix',
      name: 'Prefix',
      progressionStyle: 'loop',
      entries: [
        { id: 'prefix-1', name: '{Station}', phaseDuration: 1 },
        { id: 'prefix-2', name: '{Station} {AltitudeUp}', phaseDuration: 15 },
        { id: 'prefix-3', name: '{Station}', phaseDuration: 1 },
        { id: 'prefix-4', name: '{Station} {AltitudeDown}', phaseDuration: 15 },
      ],
    },
    {
      id: 'emblem',
      name: 'Emblem',
      progressionStyle: 'loop',
      entries: [
        { id: 'emblem-mark', name: '{Mark}', phaseDuration: 1 },
        { id: 'emblem-aspect', name: '{Aspect}', phaseDuration: 15 },
      ],
    },
  ],

  notables: [],
};

export function testZodiacCycle(): void
{
  testCelestialCycle(
    TEST_ZODIAC_CYCLE,
    160
  );
}


export function testZodiacRandomAccess(): void
{
  const period = findCelestialCyclePeriod(
    TEST_ZODIAC_CYCLE
  );

  if (!period)
  {
    throw new Error(
      'Could not determine Zodiac period.'
    );
  }

  const testSteps = [
    0,
    1,
    15,
    16,
    17,
    31,
    32,
    79,
    80,
    159,
    160,
    161,
    319,
    320,
    1000000,
    -1,
    -160,
    -161,
  ];

  const expectedNames: string[] = [];

  let progress: CelestialTagProgress[] = [];

  // Build the reference sequence using
  // the original sequential stepper.
  for (
    let index = 0;
    index < period.stepCount;
    index++
  )
  {
    const result = advanceCelestialCycle(
      TEST_ZODIAC_CYCLE,
      progress
    );

    expectedNames.push(
      result.resolved.name
    );

    progress = result.progress;
  }

  let passed = 0;

  for (const step of testSteps)
  {
    const normalizedStep = (
      (step % period.stepCount) +
      period.stepCount
    ) % period.stepCount;

    const expected =
      expectedNames[normalizedStep];

    const actual = resolveCelestialCycleStep(
      TEST_ZODIAC_CYCLE,
      step,
      period
    ).resolved.name;

    if (actual !== expected)
    {
      console.error(
        `Zodiac step ${step} FAILED`,
        { expected, actual }
      );

      continue;
    }

    passed++;
  }

  console.log(
    `Zodiac random access: ${passed}/${testSteps.length} passed`
  );
}


export function testCelestialTimeResolution(): void
{
  const secondsPerDay = 86400;

  const zodiacPeriod = findCelestialCyclePeriod(
    TEST_ZODIAC_CYCLE
  );

  if (!zodiacPeriod)
  {
    throw new Error(
      'Could not determine Zodiac period.'
    );
  }

  const zodiacDays = [
    0,
    1,
    15,
    16,
    79,
    80,
    159,
    160,
    1000000,
    -1,
  ];

  for (const day of zodiacDays)
  {
    const expected = resolveCelestialCycleStep(
      TEST_ZODIAC_CYCLE,
      day,
      zodiacPeriod
    ).resolved.name;

    const actual = resolveCelestialCycleAtTime(
      TEST_ZODIAC_CYCLE,
      day * secondsPerDay,
      zodiacPeriod
    ).resolved.name;

    if (actual !== expected)
    {
      throw new Error(
        `Zodiac timestamp failed on day ${day}`
      );
    }
  }

  const durationCycle: CelestialCycle =
  {
    id: 'test-duration',
    name: 'Duration Test',
    structure: '{Phase}',
    cycleDuration: 16 * secondsPerDay,
    cycleOffset: 0,

    tags: [
      {
        id: 'phase',
        name: 'Phase',
        progressionStyle: 'loop',
        entries: [
          {
            id: 'first',
            name: 'First',
            phaseDuration: 1,
          },
          {
            id: 'second',
            name: 'Second',
            phaseDuration: 2,
          },
          {
            id: 'third',
            name: 'Third',
            phaseDuration: 5,
          },
        ],
      },
    ],

    notables: [],
  };

  const durationPeriod =
    findCelestialCyclePeriod(durationCycle);

  if (!durationPeriod)
  {
    throw new Error(
      'Could not determine duration test period.'
    );
  }

  const expectedPhases = [
    'First',
    'First',
    'Second',
    'Second',
    'Second',
    'Second',
    'Third',
    'Third',
    'Third',
    'Third',
    'Third',
    'Third',
    'Third',
    'Third',
    'Third',
    'Third',
  ];

  for (
    let day = 0;
    day < expectedPhases.length;
    day++
  )
  {
    const actual = resolveCelestialCycleAtTime(
      durationCycle,
      day * secondsPerDay,
      durationPeriod
    ).resolved.name;

    if (actual !== expectedPhases[day])
    {
      throw new Error(
        `Duration test failed on day ${day}: ` +
        `expected ${expectedPhases[day]}, got ${actual}`
      );
    }
  }

  console.log(
    'Celestial timestamp resolution: 26/26 passed'
  );
}


export function testDefaultLunarCycle(): void
{
  const settings =
    createDefaultCelestialSettings();

  const cycle =
    settings.moons[0].phaseCycles[0];

  const expected = [
    'New Moon',
    'Waxing Crescent',
    'Waxing First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Waning Last Quarter',
    'Waning Crescent',
  ];

  const stepDuration =
    cycle.cycleDuration / expected.length;

  for (
    let index = 0;
    index < expected.length;
    index++
  )
  {
    const result = resolveLunarCycle(
      cycle,
      index * stepDuration
    );

    if (result.phaseName !== expected[index])
    {
      throw new Error(
        `Moon phase ${index + 1}: ` +
        `expected "${expected[index]}", ` +
        `got "${result.phaseName}"`
      );
    }
  }

  console.log(
    'Default lunar cycle: 8/8 passed'
  );
}
