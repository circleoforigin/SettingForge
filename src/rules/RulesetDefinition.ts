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

export interface RulesetOccurrenceTagDefinition
{
  id: string;
  label: string;
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
  occurrenceTags?: RulesetOccurrenceTagDefinition[];
  interactions?: RulesetInteractionDefinition[];
}

export interface RulesetFunctionContext
{
  input: unknown;
}

export type RulesetFunctionHandler = (context: RulesetFunctionContext) => unknown;

export interface RulesetFunctionDefinition
{
  id: string;
  handler: RulesetFunctionHandler;
}