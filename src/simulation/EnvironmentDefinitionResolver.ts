import { rulesetRegistry } from '../rules/RulesetRegistry';
import type { WorldRulesetReference } from '../models/World';
import { ENVIRONMENT_DEFINITION_ID } from './EnvironmentDefinitions';
import type {
  EnvironmentDefinitions,
  EnvironmentDefinitionOverrides,
} from './EnvironmentDefinitions';

function mergeNamedDefinitions<
  T extends { id: string }
>(
  definitions: T[],
  overrides: Partial<T>[] | undefined
): T[]
{
  if (!overrides?.length)
  {
    return definitions;
  }

  return definitions.map((definition) =>
  {
    const override = overrides.find(
      (candidate) =>
        candidate.id === definition.id
    );

    return override
      ? {
          ...definition,
          ...override,
        }
      : definition;
  });
}

export function resolveEnvironmentDefinitions(
  ruleset: WorldRulesetReference | undefined
): EnvironmentDefinitions | undefined
{
  if (!ruleset)
  {
    return undefined;
  }

  return rulesetRegistry.getDefinition<EnvironmentDefinitions>(
    ruleset.rulesetId,
    ruleset.version,
    ENVIRONMENT_DEFINITION_ID
  );
}

export function resolveEffectiveEnvironmentDefinitions(
  ruleset: WorldRulesetReference | undefined,
  overrides?: EnvironmentDefinitionOverrides
): EnvironmentDefinitions | undefined
{
  const definitions =
    resolveEnvironmentDefinitions(ruleset);

  if (!definitions)
  {
    return undefined;
  }

  if (!overrides)
  {
    return definitions;
  }

  return {
    ...definitions,

    seasons: mergeNamedDefinitions(
      definitions.seasons,
      overrides.seasons
    ),

    temperature: {
      ...definitions.temperature,
      ...overrides.temperature,
    },

    visibility: mergeNamedDefinitions(
      definitions.visibility,
      overrides.visibility
    ),

    cloudCover: mergeNamedDefinitions(
      definitions.cloudCover,
      overrides.cloudCover
    ),

    precipitation: mergeNamedDefinitions(
      definitions.precipitation,
      overrides.precipitation
    ),

    windStrength: mergeNamedDefinitions(
      definitions.windStrength,
      overrides.windStrength
    ),

    windDirections: mergeNamedDefinitions(
      definitions.windDirections,
      overrides.windDirections
    ),

    specialWeather: mergeNamedDefinitions(
      definitions.specialWeather,
      overrides.specialWeather
    ),
  };
}