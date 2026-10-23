import type {
  EnvironmentSeasonWeightVectors,
  EnvironmentWeightVector,
} from './EnvironmentDefinitions';

export type EnvironmentWeightCategory =
  | 'visibility'
  | 'cloudCover'
  | 'precipitation'
  | 'windStrength'
  | 'specialWeather';

function getSeasonalDelta(
  vectors: EnvironmentSeasonWeightVectors[] | undefined,
  seasonId: string,
  category: EnvironmentWeightCategory,
  targetId: string
): number
{
  const season =
    vectors?.find(item => item.seasonId === seasonId);

  const vector =
    season?.[category].find(
      item => item.targetId === targetId
    );

  return vector?.delta ?? 0;
}

export function resolveEnvironmentWeight(
  baseWeight: number,
  seasonId: string,
  category: EnvironmentWeightCategory,
  targetId: string,
  rulesetVectors?: EnvironmentSeasonWeightVectors[],
  worldVectors?: EnvironmentSeasonWeightVectors[],
  areaVectors?: EnvironmentSeasonWeightVectors[]
): number
{
  const total =
    baseWeight +
    getSeasonalDelta(
      rulesetVectors,
      seasonId,
      category,
      targetId
    ) +
    getSeasonalDelta(
      worldVectors,
      seasonId,
      category,
      targetId
    ) +
    getSeasonalDelta(
      areaVectors,
      seasonId,
      category,
      targetId
    );

  return Math.max(0, total);
}

export function createEnvironmentWeightVector(
  targetId: string,
  desiredWeight: number,
  inheritedWeight: number
): EnvironmentWeightVector | undefined
{
  const delta =
    desiredWeight - inheritedWeight;

  if (delta === 0)
  {
    return undefined;
  }

  return {
    targetId,
    delta,
  };
}