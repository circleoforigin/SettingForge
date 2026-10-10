import { hostEventBroker } from '../../events/HostEventBroker';
import { occurrenceService } from './OccurrenceService';
import { occurrenceCoordinator } from './OccurrenceCoordinator';
import type {
  OccurrenceProcessingResult,
  TravelContinuationPayload,
} from './OccurrenceProcessing';
import type { Occurrence } from '@settingforge/module-sdk';
import { PIECE_OCCURRENCE_LIMIT } from './OccurrenceService';
import { travelProspectService } from '../../simulation/TravelProspectService';

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

    if (!round || round.state !== 'complete')
    {
      return false;
    }

        const queuedDisplayableCount =
      occurrenceService.getPieceDisplayableCount(
        pieceId
      );

    const availableCapacity =
      Math.max(
        0,
        PIECE_OCCURRENCE_LIMIT -
          queuedDisplayableCount
      );

    if (availableCapacity === 0)
    {
      occurrenceCoordinator.removeRound(
        pieceId
      );

      return true;
    }

    const capacityBoundary =
      occurrenceCoordinator.getRoundDisplayableBoundary(
        pieceId,
        availableCapacity
      );

    if (capacityBoundary)
    {
      const completed =
        occurrenceCoordinator.takeCompletedRound(
          pieceId
        );

      if (!completed)
      {
        return false;
      }

      occurrenceService.addMany(
        completed.occurrences.filter(
          (occurrence) =>
            occurrence.simulationTime <=
              capacityBoundary.simulationTime &&
            occurrence.type !== undefined &&
            occurrence.description !== undefined
        )
      );

      const storageCursor =
        travelProspectService.truncateAtTime(
          pieceId,
          capacityBoundary.simulationTime
        );

      if (!storageCursor)
      {
        throw new Error(
          `Piece "${pieceId}" has no travel prospect at its Occurrence storage boundary.`
        );
      }

      return true;
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

      occurrenceService.addMany(
        truncated.occurrences.filter(
          (occurrence) =>
            occurrence.id !==
              recalculate.id &&
            occurrence.type !== undefined &&
            occurrence.description !== undefined
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

    occurrenceService.addMany(
      completed.occurrences.filter(
        (occurrence) =>
          occurrence.type !== undefined &&
          occurrence.description !== undefined
      )
    );

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

    if (continuation?.routeComplete)
    {
      occurrenceCoordinator.takeProspect(
        pieceId
      );
    }

    return true;
  }

  async refillPiece(
    pieceId: string
  ): Promise<boolean>
  {
    const queuedCount =
      occurrenceService.getPieceDisplayableCount(
        pieceId
      );

    if (
      queuedCount >=
      PIECE_OCCURRENCE_LIMIT
    )
    {
      return false;
    }

    const cursor =
      travelProspectService.getLatestCursor(
        pieceId
      );

    if (!cursor)
    {
      return false;
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
            cursor.routeLegId,
          startTime:
            cursor.simulationTime,
          mode: 'next-leg',
        }
      );

    return !continuation?.routeComplete;
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

        if (
      typeof payload.distanceFromLegStart ===
        'number'
    )
    {
      travelProspectService.truncateLatestInterval(
        occurrence.pieceId,
        occurrence.simulationTime,
        payload.distanceFromLegStart
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