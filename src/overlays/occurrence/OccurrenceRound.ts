import type { Occurrence } from '@settingforge/module-sdk';

export type OccurrenceRoundState =
  | 'pending'
  | 'complete';

export interface OccurrenceRound
{
  pieceId: string;
  producerIds: string[];
  completedProducerIds: string[];
  occurrences: Occurrence[];
  state: OccurrenceRoundState;
}