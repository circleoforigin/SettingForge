import type { Occurrence } from '@settingforge/module-sdk';
import type { OccurrenceReaction } from './OccurrenceProgression';

export interface OccurrenceProcessingResult
{
  occurrence: Occurrence;
  reaction: OccurrenceReaction;
}