import type {
  Occurrence,
} from '@settingforge/module-sdk';

export type GlobalOccurrenceRoundState =
  | 'pending'
  | 'complete';

export interface GlobalOccurrenceRound
{
  producerIds: string[];
  completedProducerIds: string[];
  occurrences: Occurrence[];
  state: GlobalOccurrenceRoundState;
}