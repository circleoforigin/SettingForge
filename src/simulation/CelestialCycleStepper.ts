import type { CelestialCycle } from './CelestialSettings';
import {
  resolveCelestialStructure,
  type CelestialTagProgress,
  type ResolvedCelestialStructure,
} from './CelestialStructureResolver';
import { getCelestialTagStepCount } from './CelestialTagResolver';

export interface CelestialCycleStepResult
{
  resolved: ResolvedCelestialStructure;
  progress: CelestialTagProgress[];
  activeNotableIds: string[];
}

export interface CelestialCyclePeriod
{
  stepCount: number;
  progress: CelestialTagProgress[];
}

const celestialPeriodCache = new Map<
  string,
  CelestialCyclePeriod | null
>();

export function advanceCelestialCycle(
  cycle: CelestialCycle,
  progress: CelestialTagProgress[]
): CelestialCycleStepResult
{
  const resolved = resolveCelestialStructure(
    cycle.structure,
    cycle.tags,
    progress
  );

  const counters = new Map(
    progress.map(item => [
      item.tagId,
      item.step,
    ])
  );

  // Each resolved tag is referenced once
  // during this progression step.
  for (const tag of resolved.tags)
  {
    const current = counters.get(tag.tagId) ?? 0;

    counters.set(
      tag.tagId,
      current + 1
    );
  }

  const activeNotableIds = cycle.notables
    .filter(notable =>
      notable.conditions.length > 0 &&
      notable.conditions.every(condition =>
        resolved.tags.some(tag =>
          tag.tagId === condition.tagId &&
          tag.entry.name === condition.value
        )
      )
    )
    .map(notable => notable.id);

  return {
    resolved,

    progress: Array.from(
      counters,
      ([tagId, step]) => ({
        tagId,
        step,
      })
    ),

    activeNotableIds,
  };
}

export function isCelestialCycleAtOrigin(
  cycle: CelestialCycle,
  progress: CelestialTagProgress[]
): boolean
{
  const counters = new Map(
    progress.map(item => [
      item.tagId,
      item.step,
    ])
  );

  return cycle.tags.every(tag =>
  {
    const period =
      getCelestialTagStepCount(tag);

    if (period <= 0)
    {
      return true;
    }

    const counter =
      counters.get(tag.id) ?? 0;

    return (
      ((counter % period) + period) % period
    ) === 0;
  });
}


export function findCelestialCyclePeriod(
  cycle: CelestialCycle,
  maxSteps = 100000
): CelestialCyclePeriod | undefined
{
  let progress: CelestialTagProgress[] = [];

  for (
    let step = 1;
    step <= maxSteps;
    step++
  )
  {
    const result = advanceCelestialCycle(
      cycle,
      progress
    );

    progress = result.progress;

    if (
      isCelestialCycleAtOrigin(
        cycle,
        progress
      )
    )
    {
      return {
        stepCount: step,
        progress,
      };
    }
  }

  return undefined;
}


export function getCelestialCyclePeriod(
  cycle: CelestialCycle
): CelestialCyclePeriod | undefined
{
  // Only progression-related settings affect
  // the repeating period.
  const cacheKey = JSON.stringify({
    structure: cycle.structure,

    tags: cycle.tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      progressionStyle:
        tag.progressionStyle,

      entries: tag.entries.map(entry => ({
        name: entry.name,
        phaseDuration:
          entry.phaseDuration,
      })),
    })),
  });

  const cached =
    celestialPeriodCache.get(cacheKey);

  if (cached !== undefined)
  {
    return cached ?? undefined;
  }

  const period = findCelestialCyclePeriod(
    cycle
  );

  celestialPeriodCache.set(
    cacheKey,
    period ?? null
  );

  return period;
}


export function resolveCelestialCycleStep(
  cycle: CelestialCycle,
  step: number,
  period: CelestialCyclePeriod
): CelestialCycleStepResult
{
  if (period.stepCount <= 0)
  {
    throw new Error(
      'Celestial cycle period must be positive.'
    );
  }

  // Normalize the requested step into one
  // complete repeating period.
  const normalizedStep = (
    (Math.floor(step) % period.stepCount) +
    period.stepCount
  ) % period.stepCount;

  let progress: CelestialTagProgress[] = [];

  for (
    let index = 0;
    index < normalizedStep;
    index++
  )
  {
    const result = advanceCelestialCycle(
      cycle,
      progress
    );

    progress = result.progress;
  }

  return advanceCelestialCycle(
    cycle,
    progress
  );
}


export function resolveCelestialCycleAtTime(
  cycle: CelestialCycle,
  simulationTime: number,
  period: CelestialCyclePeriod
): CelestialCycleStepResult
{
  if (
    !Number.isFinite(cycle.cycleDuration) ||
    cycle.cycleDuration <= 0
  )
  {
    throw new Error(
      'Celestial cycle duration must be positive.'
    );
  }

  if (
    !Number.isFinite(period.stepCount) ||
    !Number.isInteger(period.stepCount) ||
    period.stepCount <= 0
  )
  {
    throw new Error(
      'Celestial cycle period must be positive.'
    );
  }

  const stepDuration =
    cycle.cycleDuration / period.stepCount;

  const elapsedTime =
    simulationTime - cycle.cycleOffset;

  const step = Math.floor(
    elapsedTime / stepDuration
  );

  return resolveCelestialCycleStep(
    cycle,
    step,
    period
  );
}


