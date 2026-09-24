export type RulesetRequirementKind =
  | 'event'
  | 'command'
  | 'query';

export interface RulesetRequirement {
  id: string;
  kind: RulesetRequirementKind;
  required?: boolean;
  description?: string;
}

export interface RulesetDefinition {
  id: string;
  name: string;
  version: string;
  description?: string;

  requirements: RulesetRequirement[];
}