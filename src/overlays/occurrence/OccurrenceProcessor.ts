import type { World } from '../../models/World';
import { occurrenceService } from './OccurrenceService';
import { resolveOccurrenceReaction } from './OccurrenceReactionResolver';
import type { OccurrenceProgressionMode } from './OccurrenceProgression';
import type { OccurrenceProcessingResult } from './OccurrenceProcessing';

export class OccurrenceProcessor
{
  peek(
    world: World,
    mode: OccurrenceProgressionMode
  ): OccurrenceProcessingResult | null
  {
    const occurrence = occurrenceService.peek();

    if (!occurrence)
    {
      return null;
    }

    const reaction =
      resolveOccurrenceReaction(
        world,
        occurrence.tags,
        mode
      );

    return {
      occurrence,
      reaction,
    };
  }
}

export const occurrenceProcessor = new OccurrenceProcessor();