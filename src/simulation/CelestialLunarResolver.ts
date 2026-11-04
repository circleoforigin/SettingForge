
import type {
  CelestialPhaseCycle,
  CelestialPhaseTag,
  CelestialPhaseTagEntry,
} from './CelestialSettings';

import type {
  SimulationTime,
} from './SimulationClockService';

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
  activeNotableIds: string[];
}

function positiveModulo(
  value: number,
  divisor: number
): number
{
  return ((value % divisor) + divisor) % divisor;
}

function getTagStepCount(
  tag: CelestialPhaseTag
): number
{
  return tag.entries.reduce(
    (total, entry) =>
      total + Math.max(0, Math.trunc(entry.phaseDuration)),
    0
  );
}

function resolveLoopTag(
  tag: CelestialPhaseTag,
  cyclePosition: number,
  cycleDuration: number
): ResolvedLunarTag | undefined
{
  const stepCount = getTagStepCount(tag);

  if (stepCount <= 0)
  {
    return undefined;
  }

  const stepDuration =
    cycleDuration / stepCount;

  const tagStep =
    Math.floor(cyclePosition / stepDuration);

  const normalizedStep =
    positiveModulo(tagStep, stepCount);

  let remainingStep = normalizedStep;

  for (
    let entryIndex = 0;
    entryIndex < tag.entries.length;
    entryIndex++
  )
  {
    const entry = tag.entries[entryIndex];

    const duration =
      Math.max(0, Math.trunc(entry.phaseDuration));

    if (remainingStep < duration)
    {
      return {
        tagId: tag.id,
        tagName: tag.name,
        entry,
        entryIndex,
        stepWithinEntry: remainingStep + 1,

        elapsedInEntry:
          remainingStep * stepDuration +
          positiveModulo(
            cyclePosition,
            stepDuration
          ),
      };
    }

    remainingStep -= duration;
  }

  return undefined;
}

function resolvePhaseName(
  structure: string,
  tags: ResolvedLunarTag[]
): string
{
  let result = structure;

  for (const tag of tags)
  {
    const token = `{${tag.tagName}}`;

    result = result.split(token).join(
      tag.entry.name
    );
  }

  return result
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveLunarCycle(
  cycle: CelestialPhaseCycle,
  time: SimulationTime
): ResolvedLunarCycle
{
  const duration = cycle.cycleDuration;

  if (
    !Number.isFinite(duration) ||
    duration <= 0
  )
  {
    return {
      cycleId: cycle.id,
      cycleName: cycle.name,
      phaseName: '',
      elapsedInCycle: 0,
      tags: [],
      activeNotableIds: [],
    };
  }

  const cyclePosition = positiveModulo(
    time + cycle.cycleOffset,
    duration
  );

  const tags = cycle.tags
    .map(tag =>
    {
      if (tag.progressionStyle !== 'loop')
      {
        return undefined;
      }

      return resolveLoopTag(
        tag,
        cyclePosition,
        duration
      );
    })
    .filter(
      (tag): tag is ResolvedLunarTag =>
        tag !== undefined
    );

  const phaseName = resolvePhaseName(
    cycle.structure,
    tags
  );

  const activeNotableIds = cycle.notables
    .filter(notable =>
      notable.conditions.length > 0 &&
      notable.conditions.every(condition =>
        tags.some(tag =>
          tag.tagId === condition.tagId &&
          tag.entry.name === condition.value
        )
      )
    )
    .map(notable => notable.id);

  return {
    cycleId: cycle.id,
    cycleName: cycle.name,
    phaseName,
    elapsedInCycle: cyclePosition,
    tags,
    activeNotableIds,
  };
}
