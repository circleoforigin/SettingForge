import type {
  Occurrence,
  OccurrenceReaction,
} from '@settingforge/module-sdk';

export interface TravelRecalculationPayload
{
  routeLegId: string;
  remainingDistance: number;
}

export interface TravelNextLegPayload
{
  routeLegId: string;
}

export interface OccurrenceProcessingResult
{
  occurrence: Occurrence;
  reaction: OccurrenceReaction;
}