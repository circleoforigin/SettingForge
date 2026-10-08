import type {
  Occurrence,
  OccurrenceReaction,
} from '@settingforge/module-sdk';

export interface OccurrenceProcessingResult
{
  occurrence: Occurrence;
  reaction: OccurrenceReaction;
}