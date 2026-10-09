import type { Occurrence } from '@settingforge/module-sdk';

export interface OccurrenceProspect
{
  pieceId: string;
  occurrences: Occurrence[];
}