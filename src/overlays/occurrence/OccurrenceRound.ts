export type OccurrenceRoundState =
  | 'pending'
  | 'complete';

export interface OccurrenceRound
{
  pieceId: string;
  producerIds: string[];
  completedProducerIds: string[];
  state: OccurrenceRoundState;
}