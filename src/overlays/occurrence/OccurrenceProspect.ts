import type { Occurrence } from '@settingforge/module-sdk';

export type OccurrenceProspectKind =
  | 'travel'
  | 'stationary-time';

export interface OccurrenceProspect
{
  pieceId: string;
  kind?: OccurrenceProspectKind;

  routeLegId?: string;
  legEndTime?: number;

  targetTime?: number;

  occurrences: Occurrence[];
}