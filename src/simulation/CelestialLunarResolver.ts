
import type {
  CelestialPhaseCycle,
  CelestialPhaseTagEntry,
} from './CelestialSettings';

import type {
  SimulationTime,
} from './SimulationClockService';

import {
  getCelestialCyclePeriod,
  resolveCelestialCycleAtTime,
} from './CelestialCycleStepper';

export interface ResolvedLunarTag
{
  tagId: string;
  tagName: string;

  entry: CelestialPhaseTagEntry;

  entryIndex: number;
  stepWithinEntry: number;

  elapsedInEntry: SimulationTime;
}

export interface ResolvedLunarCycle
{
  cycleId: string;
  cycleName: string;

  phaseName: string;

  elapsedInCycle: SimulationTime;

  tags: ResolvedLunarTag[];
}

function positiveModulo(
  value: number,
  divisor: number
): number
{
  return ((value % divisor) + divisor) % divisor;
}

export function resolveLunarCycle(
  cycle: CelestialPhaseCycle,
  time: SimulationTime
): ResolvedLunarCycle
{
  const emptyResult: ResolvedLunarCycle =
  {
    cycleId: cycle.id,
    cycleName: cycle.name,
    phaseName: '',
    elapsedInCycle: 0,
    tags: [],
  };

  if (
    !Number.isFinite(cycle.cycleDuration) ||
    cycle.cycleDuration <= 0
  )
  {
    return emptyResult;
  }

  const period = getCelestialCyclePeriod(cycle);

  if (!period)
  {
    return emptyResult;
  }

  const stepDuration = cycle.cycleDuration / period.stepCount;

  const elapsed = time + cycle.cycleOffset;

  const elapsedInCycle = positiveModulo(
    elapsed,
    cycle.cycleDuration
  );

  const elapsedInStep = positiveModulo(
    elapsedInCycle,
    stepDuration
  );

  const result = resolveCelestialCycleAtTime(
    cycle,
    time,
    period
  );

  const tags: ResolvedLunarTag[] =
    result.resolved.tags.map(tag => ({
      tagId: tag.tagId,
      tagName: tag.tagName,

      entry: tag.entry,
      entryIndex: tag.entryIndex,
      stepWithinEntry:
        tag.stepWithinEntry,

      elapsedInEntry:
        (tag.stepWithinEntry - 1) *
          stepDuration +
        elapsedInStep,
    }));

  return {
    cycleId: cycle.id,
    cycleName: cycle.name,

    phaseName: result.resolved.name,

    elapsedInCycle,

    tags,
  };
}
