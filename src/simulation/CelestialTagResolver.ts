import type {
  CelestialTag,
  CelestialTagEntry,
} from './CelestialSettings';

export interface ResolvedCelestialTag
{
  tagId: string;
  tagName: string;

  entry: CelestialTagEntry;
  entryIndex: number;

  stepWithinEntry: number;
}

function positiveModulo(
  value: number,
  divisor: number
): number
{
  return ((value % divisor) + divisor) % divisor;
}

function getProgressionIndices(
  tag: CelestialTag
): number[]
{
  const count = tag.entries.length;

  if (count === 0)
  {
    return [];
  }

  const forward = tag.entries.map(
    (_, index) => index
  );

  switch (tag.progressionStyle)
  {
    case 'peak':
    {
      const reverse: number[] = [];

      for (
        let index = count - 2;
        index > 0;
        index--
      )
      {
        reverse.push(index);
      }

      return [...forward, ...reverse];
    }

    case 'wave':
    {
      const reverse: number[] = [];

      for (
        let index = count - 1;
        index >= 0;
        index--
      )
      {
        reverse.push(index);
      }

      return [...forward, ...reverse];
    }

    case 'loop':
    default:
    {
      return forward;
    }
  }
}

export function getCelestialTagStepCount(
  tag: CelestialTag
): number
{
  return getProgressionIndices(tag).reduce(
    (total, index) =>
      total + Math.max(
        0,
        Math.trunc(
          tag.entries[index].phaseDuration
        )
      ),
    0
  );
}

export function resolveCelestialTag(
  tag: CelestialTag,
  step: number
): ResolvedCelestialTag | undefined
{
  const indices = getProgressionIndices(tag);

  const totalSteps =
    getCelestialTagStepCount(tag);

  if (totalSteps <= 0)
  {
    return undefined;
  }

  let remainingStep = positiveModulo(
    Math.floor(step),
    totalSteps
  );

  for (const entryIndex of indices)
  {
    const entry = tag.entries[entryIndex];

    const duration = Math.max(
      0,
      Math.trunc(entry.phaseDuration)
    );

    if (remainingStep < duration)
    {
      return {
        tagId: tag.id,
        tagName: tag.name,

        entry,
        entryIndex,

        stepWithinEntry:
          remainingStep + 1,
      };
    }

    remainingStep -= duration;
  }

  return undefined;
}