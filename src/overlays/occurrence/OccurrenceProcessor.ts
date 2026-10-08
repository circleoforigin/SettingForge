import { occurrenceService } from './OccurrenceService';
import type { OccurrenceProcessingResult } from './OccurrenceProcessing';

export class OccurrenceProcessor
{
  peek(): OccurrenceProcessingResult | null
  {
    const occurrence = occurrenceService.peek();

    if (!occurrence)
    {
      return null;
    }

    return {
      occurrence,
      reaction: occurrence.reaction,
    };
  }
}

export const occurrenceProcessor = new OccurrenceProcessor();