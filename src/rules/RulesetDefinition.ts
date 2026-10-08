import type { RulesetInteractionDefinition } from '@settingforge/module-sdk';

export type RulesetRequirementKind =
  | 'event'
  | 'command'
  | 'query';

export interface RulesetRequirement
{
  id: string;
  kind: RulesetRequirementKind;
  required?: boolean;
  description?: string;
}

export interface RulesetDefinition
{
  id: string;
  name: string;
  version: string;
  description?: string;

  requirements: RulesetRequirement[];
  functions?: RulesetFunctionDefinition[];
  interactions?: RulesetInteractionDefinition[];
}

export interface RulesetEntityFact<T = unknown>
{
  entityId: string;
  value: T;
}

export interface RulesetFunctionContext
{
  input: unknown;

  requestEntityFacts<T = unknown>(
    entityIds: readonly string[],
    fact: string
  ): Promise<RulesetEntityFact<T>[]>;
}

export type RulesetFunctionHandler =
  (
    context: RulesetFunctionContext
  ) => unknown | Promise<unknown>;

export interface RulesetFunctionDefinition
{
  id: string;
  handler: RulesetFunctionHandler;
}