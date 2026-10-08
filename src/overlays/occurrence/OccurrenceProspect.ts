export type OccurrenceProspectState =
  | 'pending'
  | 'complete';

export interface OccurrenceProspect
{
  id: string;
  producerIds: string[];
  completedProducerIds: string[];
  state: OccurrenceProspectState;
}