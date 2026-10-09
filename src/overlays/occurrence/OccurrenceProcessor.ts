import { hostEventBroker } from '../../events/HostEventBroker';
import { occurrenceService } from './OccurrenceService';
import { occurrenceCoordinator } from './OccurrenceCoordinator';
import type {
  OccurrenceProcessingResult,
  TravelContinuationPayload,
} from './OccurrenceProcessing';

export class OccurrenceProcessor
{
  peek(): OccurrenceProcessingResult | null
  {
    const occurrence = occurrenceService.peek();

    if (!occurrence)
    {
      return null;
    }

    if (occurrence.pieceId)
    {
      const round =
        occurrenceCoordinator.getRound(
          occurrence.pieceId
        );

      if (round?.state === 'pending')
      {
        return null;
      }
    }

    return {
      occurrence,
      reaction: occurrence.reaction,
    };
  }

    async processSilent(): Promise<boolean>
  {
    const result = this.peek();

    if (!result)
    {
      return false;
    }

    const occurrence = result.occurrence;

    if (
      occurrence.type !== undefined &&
      occurrence.title !== undefined
    )
    {
      return false;
    }

    switch (result.reaction)
    {
      case 'recalculate':
        return this.processRecalculate();

      case 'notify':
      case 'interrupt':
        return false;

      case 'end':
        occurrenceService.remove(
          occurrence.id
        );

        return true;

      case 'none':
        occurrenceService.remove(
          occurrence.id
        );

        return true;
    }
  }

  async processRecalculate(): Promise<boolean>
  {
    const result = this.peek();

    if (!result || result.reaction !== 'recalculate')
    {
      return false;
    }

    const occurrence = result.occurrence;

    if (!occurrence.pieceId)
    {
      throw new Error(
        'Recalculate Occurrence requires pieceId.'
      );
    }

    const payload =
      occurrence.payload as
        | TravelContinuationPayload
        | undefined;

    if (
      !payload?.routeLegId ||
      !payload.mode
    )
    {
      throw new Error(
        'Travel Recalculate Occurrence requires continuation data.'
      );
    }

    occurrenceService.truncatePiece(
      occurrence.pieceId,
      occurrence.simulationTime
    );

    occurrenceService.remove(occurrence.id);

    await hostEventBroker.requestModule(
      'regions',
      'Regions.ContinueTravel',
      {
        pieceId: occurrence.pieceId,
        routeLegId: payload.routeLegId,
        startTime: occurrence.simulationTime,
        mode: payload.mode,
        remainingDistance:
          payload.remainingDistance,
      }
    );

    return true;
  }
}

export const occurrenceProcessor = new OccurrenceProcessor();