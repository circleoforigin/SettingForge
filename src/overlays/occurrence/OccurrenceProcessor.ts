import { hostEventBroker } from '../../events/HostEventBroker';
import { occurrenceService } from './OccurrenceService';
import { occurrenceCoordinator } from './OccurrenceCoordinator';
import type {
  OccurrenceProcessingResult,
  TravelContinuationPayload,
} from './OccurrenceProcessing';
import type { Occurrence } from '@settingforge/module-sdk';
import { PIECE_OCCURRENCE_LIMIT } from './OccurrenceService';

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

  async resolveRound(
    pieceId: string
  ): Promise<boolean>
  {
    const round =
      occurrenceCoordinator.getRound(
        pieceId
      );

    if (
      !round ||
      round.state !== 'complete'
    )
    {
      return false;
    }

    const recalculate =
      occurrenceCoordinator.truncateAtRecalculate(
        pieceId
      );

    if (recalculate)
    {
      const truncated =
        occurrenceCoordinator.getRound(
          pieceId
        );

      if (!truncated)
      {
        return false;
      }

      occurrenceCoordinator.addProspectOccurrences(
        pieceId,
        truncated.occurrences.filter(
          (occurrence) =>
            occurrence.id !==
              recalculate.id ||
            (
              occurrence.type !== undefined &&
              occurrence.description !== undefined
            )
        )
      );

      await this.processRoundRecalculate(
        recalculate
      );

      return true;
    }

    const completed =
      occurrenceCoordinator.takeCompletedRound(
        pieceId
      );

    if (!completed)
    {
      return false;
    }

    occurrenceCoordinator.addProspectOccurrences(
      pieceId,
      completed.occurrences
    );

    const displayableCount =
      occurrenceCoordinator.getProspectDisplayableCount(
        pieceId
      );

    if (
      displayableCount <
      PIECE_OCCURRENCE_LIMIT
    )
    {
      const prospect =
        occurrenceCoordinator.getProspect(
          pieceId
        );

      if (
        !prospect?.routeLegId ||
        prospect.legEndTime === undefined
      )
      {
        throw new Error(
          `Piece "${pieceId}" has no travel prospect context.`
        );
      }

      const continuation =
        await hostEventBroker.requestModule<{
          routeComplete?: boolean;
        }>(
          'regions',
          'Regions.ContinueTravel',
          {
            pieceId,
            routeLegId:
              prospect.routeLegId,
            startTime:
              prospect.legEndTime,
            mode: 'next-leg',
          }
        );

      if (!continuation?.routeComplete)
      {
        return true;
      }

      const completedProspect =
        occurrenceCoordinator.takeProspect(
          pieceId
        );

      if (completedProspect)
      {
        occurrenceService.addMany(
          completedProspect.occurrences
        );
      }

      return true;
    }

        const boundary =
      occurrenceCoordinator.getProspectDisplayableBoundary(
        pieceId,
        PIECE_OCCURRENCE_LIMIT
      );

    const prospect =
      occurrenceCoordinator.takeProspect(
        pieceId
      );

    if (
      !boundary ||
      !prospect
    )
    {
      return false;
    }

    occurrenceService.addMany(
      prospect.occurrences.filter(
        (occurrence) =>
          occurrence.simulationTime <=
          boundary.simulationTime
      )
    );

    return true;
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
      occurrence.description !== undefined
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

  private async processRoundRecalculate(
    occurrence: Occurrence
  ): Promise<void>
  {
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

    occurrenceCoordinator.removeRound(
      occurrence.pieceId
    );

    await hostEventBroker.requestModule(
      'regions',
      'Regions.ContinueTravel',
      {
        pieceId: occurrence.pieceId,
        routeLegId: payload.routeLegId,
        startTime: occurrence.simulationTime,
        mode: payload.mode,
        remainingDistance: payload.remainingDistance,
        distanceFromLegStart: payload.distanceFromLegStart,
      }
    );
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
        remainingDistance: payload.remainingDistance,
        distanceFromLegStart: payload.distanceFromLegStart,
      }
    );

    return true;
  }
}

export const occurrenceProcessor = new OccurrenceProcessor();