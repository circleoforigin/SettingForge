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

export function resolveEffectiveEnvironmentDefinitions(
  ruleset: WorldRulesetReference | undefined,
  overrides?: EnvironmentDefinitionOverrides
): EnvironmentDefinitions
{
  const defaults =
    createDefaultEnvironmentDefinitions();

  const rulesetDefinitions =
    resolveEnvironmentDefinitions(ruleset);

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

    temperature: {
      ...definitions.temperature,
      ...overrides?.temperature,
    },
  };
}