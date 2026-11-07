
import type {
  CelestialNotable,
  CelestialNotableCondition,
  CelestialSettings,
  CelestialCycle,
} from './CelestialSettings';

import type {
  SimClockEra,
} from './SimClockSettings';

import {
  resolveCelestialCycle,
} from './CelestialCycleStepper';

import {
  getCelestialCyclePeriod,
  getCelestialCalendarEntryStart,
} from './CelestialCycleStepper';

import {
  simulationTimeToCalendar,
} from './SimCalendar';

function findNotableCycle(
  settings: CelestialSettings,
  condition: CelestialNotableCondition
): CelestialCycle | undefined
{
  const moon = settings.moons.find(
    item => item.id === condition.bodyId
  );

  if (moon)
  {
    return moon.phaseCycles.find(
      cycle => cycle.id === condition.cycleId
    );
  }

  const zodiac = settings.zodiacs.find(
    item => item.id === condition.bodyId
  );

  return zodiac?.cycles.find(
    cycle => cycle.id === condition.cycleId
  );
}

export function isCelestialNotableActive(
  notable: CelestialNotable,
  settings: CelestialSettings,
  simulationTime: number,
  era: SimClockEra
): boolean
{
  if (notable.conditions.length === 0)
  {
    return false;
  }

  return notable.conditions.every(condition =>
  {
    const cycle = findNotableCycle(
      settings,
      condition
    );

    if (!cycle)
    {
      return false;
    }

    const result = resolveCelestialCycle(
      cycle,
      simulationTime,
      era
    );

    return result.resolved.tags.some(tag =>
      tag.tagId === condition.tagId &&
      tag.entry.name === condition.value
    );
  });
}

function findCycle(
  settings: CelestialSettings,
  bodyId: string,
  cycleId: string
): CelestialCycle | undefined
{
  const moon = settings.moons.find(
    item => item.id === bodyId
  );

  if (moon)
  {
    return moon.phaseCycles.find(
      cycle => cycle.id === cycleId
    );
  }

  const zodiac = settings.zodiacs.find(
    item => item.id === bodyId
  );

  return zodiac?.cycles.find(
    cycle => cycle.id === cycleId
  );
}

function getCycleBoundaries(
  cycle: CelestialCycle,
  startTime: number,
  endTime: number,
  era: SimClockEra
): number[]
{
  const boundaries: number[] = [];

  if (cycle.cycleMeasurement === 'calendar')
  {
    const firstYear =
      simulationTimeToCalendar(
        startTime,
        era
      ).year;

    const lastYear =
      simulationTimeToCalendar(
        endTime,
        era
      ).year;

    for (
      let year = firstYear - 1;
      year <= lastYear;
      year++
    )
    {
      for (const tag of cycle.tags)
      {
        for (const entry of tag.entries)
        {
          const boundary =
            getCelestialCalendarEntryStart(
              entry,
              year,
              cycle.cycleOffset,
              era
            );

          if (
            boundary !== undefined &&
            boundary > startTime &&
            boundary <= endTime
          )
          {
            boundaries.push(boundary);
          }
        }
      }
    }

    return boundaries;
  }

  const period =
    getCelestialCyclePeriod(cycle);

  if (
    !period ||
    period.stepCount <= 0 ||
    !Number.isFinite(cycle.cycleDuration) ||
    cycle.cycleDuration <= 0 ||
    !Number.isFinite(cycle.cycleOffset)
  )
  {
    return [];
  }

  const stepDuration =
    cycle.cycleDuration / period.stepCount;

  const firstStep =
    Math.floor(
      (startTime + cycle.cycleOffset) /
      stepDuration
    ) + 1;

  const lastStep =
    Math.floor(
      (endTime + cycle.cycleOffset) /
      stepDuration
    );

  for (
    let step = firstStep;
    step <= lastStep;
    step++
  )
  {
    const boundary =
      step * stepDuration -
      cycle.cycleOffset;

    if (
      boundary > startTime &&
      boundary <= endTime
    )
    {
      boundaries.push(boundary);
    }
  }

  return boundaries;
}


export function resolveNextCelestialNotable(
  notable: CelestialNotable,
  settings: CelestialSettings,
  afterTime: number,
  throughTime: number,
  era: SimClockEra
): number | undefined
{
  if (
    !Number.isFinite(afterTime) ||
    !Number.isFinite(throughTime) ||
    throughTime <= afterTime ||
    notable.conditions.length === 0
  )
  {
    return undefined;
  }

  const cycles = new Map<
    string,
    CelestialCycle
  >();

  for (const condition of notable.conditions)
  {
    const cycle = findCycle(
      settings,
      condition.bodyId,
      condition.cycleId
    );

    if (!cycle)
    {
      return undefined;
    }

    cycles.set(
      JSON.stringify([
        condition.bodyId,
        condition.cycleId,
      ]),
      cycle
    );
  }

  const candidates = new Set<number>();

  for (const cycle of cycles.values())
  {
    for (
      const boundary of getCycleBoundaries(
        cycle,
        afterTime,
        throughTime,
        era
      )
    )
    {
      candidates.add(boundary);
    }
  }

  const sortedCandidates =
    Array.from(candidates).sort(
      (left, right) => left - right
    );

  let wasActive =
    isCelestialNotableActive(
      notable,
      settings,
      afterTime,
      era
    );

  for (const time of sortedCandidates)
  {
    const isActive =
      isCelestialNotableActive(
        notable,
        settings,
        time,
        era
      );

    if (!wasActive && isActive)
    {
      return time;
    }

    wasActive = isActive;
  }

  return undefined;
}


