import { rulesetRegistry } from '../rules/RulesetRegistry';
import type { WorldRulesetReference } from '../models/World';
import { ENVIRONMENT_DEFINITION_ID } from './EnvironmentDefinitions';
import type {
  EnvironmentDefinitions,
  EnvironmentDefinitionOverrides,
} from './EnvironmentDefinitions';
import { createDefaultEnvironmentDefinitions } from './EnvironmentDefaults';

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

function applyDefinitionOverrides<
  T extends { id: string }
>(
  definitions: T[],
  overrides?: Partial<T>[]
): T[]
{
  return definitions.map(definition =>
  {
    const override = overrides?.find(
      item => item.id === definition.id
    );

    return override
      ? { ...definition, ...override }
      : definition;
  });
}

export function resolveEffectiveEnvironmentDefinitions(
  ruleset: WorldRulesetReference | undefined,
  overrides?: EnvironmentDefinitionOverrides
): EnvironmentDefinitions
{
  const defaults = createDefaultEnvironmentDefinitions();

  const rulesetDefinitions = resolveEnvironmentDefinitions(ruleset);

  const definitions: EnvironmentDefinitions = {
    ...defaults,
    ...structuredClone(rulesetDefinitions ?? {}),

    temperature: {
      ...defaults.temperature,
      ...rulesetDefinitions?.temperature,
    },

    generation: {
      ...defaults.generation!,
      ...rulesetDefinitions?.generation,
    },
  };

  return {
    ...definitions,

    seasons: applyDefinitionOverrides(
      definitions.seasons,
      overrides?.seasons
    ),

    temperature: {
      ...definitions.temperature,
      ...overrides?.temperature,
    },

    visibility:
      overrides?.replacements?.visibility ??
      applyDefinitionOverrides(
        definitions.visibility,
        overrides?.visibility
      ),

    cloudCover:
      overrides?.replacements?.cloudCover ??
      applyDefinitionOverrides(
        definitions.cloudCover,
        overrides?.cloudCover
      ),

    precipitation:
      overrides?.replacements?.precipitation ??
      applyDefinitionOverrides(
        definitions.precipitation,
        overrides?.precipitation
      ),

    windStrength:
      overrides?.replacements?.windStrength ??
      applyDefinitionOverrides(
        definitions.windStrength,
        overrides?.windStrength
      ),

    windDirections:
      overrides?.replacements?.windDirections ??
      applyDefinitionOverrides(
        definitions.windDirections,
        overrides?.windDirections
      ),

    specialWeather:
      overrides?.replacements?.specialWeather ??
      applyDefinitionOverrides(
        definitions.specialWeather,
        overrides?.specialWeather
      ),

    generation: {
      ...definitions.generation!,
      ...overrides?.generation,
    },
  };
}