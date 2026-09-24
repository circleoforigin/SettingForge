import {
  capabilityRegistry,
} from '../capabilities/CapabilityRegistry';

import type {
  RulesetDefinition,
  RulesetRequirement,
} from './RulesetDefinition';

export type RulesetRequirementStatus =
  | 'available'
  | 'missing';

export interface ResolvedRulesetRequirement {
  requirement: RulesetRequirement;
  status: RulesetRequirementStatus;
}

export interface RulesetResolution {
  rulesetId: string;
  rulesetVersion: string;
  requirements: ResolvedRulesetRequirement[];
  ready: boolean;
}

function capabilityExists(
  requirement: RulesetRequirement
): boolean {
  switch (requirement.kind) {
    case 'event':
      return (
        capabilityRegistry.getEvent(
          requirement.id
        ) !== undefined
      );

    case 'command':
      return (
        capabilityRegistry.getCommand(
          requirement.id
        ) !== undefined
      );

    case 'query':
      return (
        capabilityRegistry.getQuery(
          requirement.id
        ) !== undefined
      );
  }
}

function resolveRequirement(
  requirement: RulesetRequirement
): ResolvedRulesetRequirement {
  return {
    requirement,
    status:
      capabilityExists(requirement)
        ? 'available'
        : 'missing',
  };
}

export class RulesetRequirementResolver {
  resolve(
    ruleset: RulesetDefinition
  ): RulesetResolution {
    const requirements =
      ruleset.requirements.map(
        resolveRequirement
      );

    const ready =
      requirements.every((result) => {
        if (
          result.requirement.required === false
        ) {
          return true;
        }

        return result.status === 'available';
      });

    return {
      rulesetId: ruleset.id,
      rulesetVersion: ruleset.version,
      requirements,
      ready,
    };
  }
}

export const rulesetRequirementResolver =
  new RulesetRequirementResolver();