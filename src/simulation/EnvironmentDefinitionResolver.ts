import {
  rulesetRegistry,
} from '../rules/RulesetRegistry';

import type {
  WorldRulesetReference,
} from '../models/World';

import {
  ENVIRONMENT_DEFINITION_ID,
} from './EnvironmentDefinitions';

import type {
  EnvironmentDefinitions,
} from './EnvironmentDefinitions';

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