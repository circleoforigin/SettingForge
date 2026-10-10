import type {
  Occurrence,
  OccurrenceReaction,
} from '@settingforge/module-sdk';

export interface TravelContinuationPayload
{
  mode: 'recalculate' | 'next-leg';
  routeLegId: string;
  remainingDistance?: number;
  distanceFromLegStart?: number;
}

export interface OccurrenceProcessingResult
{
  occurrence: Occurrence;
  reaction: OccurrenceReaction;
}