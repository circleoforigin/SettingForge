import type {
  World,
  WorldRulesetReference,
} from '../models/World';

import type {
  RulesetInteractionDefinition,
} from '@settingforge/module-sdk';

import type {
  RulesetDefinition,
} from './RulesetDefinition';

import type {
  RulesetResolution,
} from './RulesetRequirementResolver';

import {
  rulesetRegistry,
} from './RulesetRegistry';

import {
  rulesetRequirementResolver,
} from './RulesetRequirementResolver';

export interface ActiveRuleset {
  definition: RulesetDefinition;
  resolution: RulesetResolution;
}

export class RulesService {
  getRuleset(
    reference: WorldRulesetReference
  ): RulesetDefinition | undefined {
    return rulesetRegistry.get(
      reference.rulesetId,
      reference.version
    );
  }

  getActiveRuleset(
    world: World
  ): ActiveRuleset | null {
    if (!world.ruleset) {
      return null;
    }

    const definition =
      this.getRuleset(world.ruleset);

    if (!definition) {
      return null;
    }

    return {
      definition,
      resolution:
        rulesetRequirementResolver.resolve(
          definition
        ),
    };
  }

  getInteraction(
  world: World,
  target: string
): RulesetInteractionDefinition | null {
  const activeRuleset =
    this.getActiveRuleset(world);

  if (!activeRuleset) {
    return null;
  }

  return (
    activeRuleset.definition
      .interactions
      ?.find(
        (interaction) =>
          interaction.target === target
      ) ??
    null
  );
}

executeFunction(
  world: World,
  functionId: string,
  input: unknown
): unknown
{
  const activeRuleset =
    this.getActiveRuleset(world);

  if (!activeRuleset)
  {
    throw new Error(
      'No active Ruleset is available.'
    );
  }

  const ruleFunction =
    activeRuleset.definition
      .functions
      ?.find(
        (candidate) =>
          candidate.id === functionId
      );

  if (!ruleFunction)
  {
    throw new Error(
      `Ruleset function "${functionId}" is not supported.`
    );
  }

  return ruleFunction.handler({
    input,
  });
}

  getResolution(
    world: World
  ): RulesetResolution | null {
    return (
      this.getActiveRuleset(world)
        ?.resolution ??
      null
    );
  }

    isReady(
    world: World
  ): boolean {
    if (!world.ruleset) {
      return true;
    }

    const activeRuleset =
      this.getActiveRuleset(world);

    if (!activeRuleset) {
      return false;
    }

    return activeRuleset
      .resolution
      .ready;
  }
}

export const rulesService =
  new RulesService();