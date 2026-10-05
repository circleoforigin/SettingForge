import type { RulesetInteractionDefinition } from '@settingforge/module-sdk';
import type {
  OccurrenceProgressionMode,
  OccurrenceReaction,
} from '../overlays/occurrence/OccurrenceProgression';

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

  reactions: Record<
    OccurrenceProgressionMode,
    OccurrenceReaction
  >;
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