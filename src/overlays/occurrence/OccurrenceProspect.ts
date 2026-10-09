import type { Occurrence } from '@settingforge/module-sdk';

export interface OccurrenceProspect
{
  pieceId: string;
  routeLegId?: string;
  legEndTime?: number;
  occurrences: Occurrence[];
}