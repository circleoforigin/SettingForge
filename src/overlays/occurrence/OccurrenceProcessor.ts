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
import { stationaryTimeProspectService } from '../../simulation/StationaryTimeProspectService';
import { simulationClockService } from '../../simulation/SimulationClockService';

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

      const prospect =
        occurrenceCoordinator.getProspect(
          pieceId
        );

      if (prospect?.kind === 'stationary-time')
      {
        stationaryTimeProspectService
          .setStorageCursor(
            pieceId,
            capacityBoundary.simulationTime
          );

        return true;
      }

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

      travelProspectService.setStorageCursor(
        storageCursor
      );

      return true;
    }

    const recalculate =
      occurrenceCoordinator.truncateAtRecalculate(
        pieceId
      );

    if (recalculate)
    {
      const truncated = occurrenceCoordinator.getRound(pieceId);

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

      await this.processRoundRecalculate(recalculate);

      return true;
    }

    const completed =
      occurrenceCoordinator.takeCompletedRound(pieceId);

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

    const prospect = occurrenceCoordinator.getProspect(pieceId);

    if (prospect?.kind === 'stationary-time')
    {
      occurrenceCoordinator.takeProspect(pieceId);

      stationaryTimeProspectService
        .markComplete(pieceId);

      return true;
    }

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
          routeLegId: prospect.routeLegId,
          startTime: prospect.legEndTime,
          mode: 'next-leg',
        }
      );

    if (continuation?.routeComplete)
    {
      occurrenceCoordinator.takeProspect(pieceId);

      travelProspectService.markRouteComplete(pieceId);
    }

    return true;
  }

    completeStationaryTimeIfReady(): boolean
  {
    if (
      !stationaryTimeProspectService
        .isOperationComplete()
    )
    {
      return false;
    }

    const targetTime =
      stationaryTimeProspectService
        .getTargetTime();

    if (targetTime === undefined)
    {
      return false;
    }

    const pendingBeforeTarget =
      occurrenceService
        .getVisibleOccurrences()
        .some(
          (occurrence) =>
            occurrence.simulationTime <=
              targetTime
        );

    if (
      occurrenceService.getCount() > 0 ||
      pendingBeforeTarget
    )
    {
      return false;
    }

    simulationClockService.setTime(
      targetTime
    );

    occurrenceCoordinator.clear();
    stationaryTimeProspectService.clear();

    return true;
  }

  async refillPiece(
    pieceId: string
  ): Promise<boolean>
  {
    const activeRound =
      occurrenceCoordinator.getRound(
        pieceId
      );

    if (activeRound)
    {
      return false;
    }

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

    const stationaryProspect =
      stationaryTimeProspectService
        .getProspect(
          pieceId
        );

    if (stationaryProspect)
    {
      if (stationaryProspect.complete)
      {
        return false;
      }

      const cursor =
        stationaryTimeProspectService
          .getStorageCursor(
            pieceId
          );

      if (
        cursor === undefined ||
        cursor >=
          stationaryProspect.targetTime
      )
      {
        return false;
      }

      await hostEventBroker.requestModule(
        'regions',
        'Regions.ContinueProgressTime',
        {
          pieceId,
          startTime:
            cursor,
          targetTime:
            stationaryProspect.targetTime,
        }
      );

      return true;
    }

    if (
      travelProspectService.isRouteComplete(
        pieceId
      )
    )
    {
      return false;
    }

    const cursor =
      travelProspectService.getStorageCursor(
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
          mode:
            cursor.atLegEnd
              ? 'next-leg'
              : 'recalculate',
          distanceFromLegStart:
            cursor.atLegEnd
              ? undefined
              : cursor.distanceFromLegStart,
        }
      );

    if (continuation?.routeComplete)
    {
      travelProspectService.markRouteComplete(
        pieceId
      );

      return false;
    }

    return true;
  }

  private async commitThrough(
    occurrence: Occurrence
  ): Promise<void>
  {
    const simulationTime = occurrence.simulationTime;

    const stationaryOperationActive =
      stationaryTimeProspectService
        .getTargetTime() !== undefined;

    if (!stationaryOperationActive)
    {
      const positions =
        travelProspectService.resolvePositionsAt(simulationTime);

for (const position of positions)
{
  const result =
    await hostEventBroker.requestModule<{
      routeComplete?: boolean;
    }>(
      'regions',
      'Regions.CommitTravelPosition',
      {
        pieceId: position.pieceId,
        routeLegId:
          position.routeLegId,
        distanceFromLegStart:
          position.distanceFromLegStart,
      }
    );

  if (result?.routeComplete)
  {
    travelProspectService
      .markRouteComplete(
        position.pieceId
      );
  }
}
    }

    simulationClockService.setTime(simulationTime);
  }

  async handleOccurrence(
    occurrence: Occurrence
  ): Promise<void>
  {
    await this.commitThrough(occurrence);

    occurrenceService.clearOperationOccurrences();
    occurrenceCoordinator.clear();
    travelProspectService.clear();
    stationaryTimeProspectService.clear();
  }

  async progressOccurrences(
    maximum: number
  ): Promise<boolean>
  {
    const visible = occurrenceService.getVisibleOccurrences();

    const count =
      Math.max(
        0,
        Math.min(
          Math.trunc(maximum),
          visible.length
        )
      );

    if (count === 0)
    {
      return false;
    }

    const target = visible[count - 1];

await this.commitThrough(target);

occurrenceService.consumeVisible(count);

if (
  travelProspectService
    .areAllRoutesComplete()
)
{
  occurrenceService
    .clearOperationOccurrences();

  occurrenceCoordinator.clear();
  travelProspectService.clear();

  return true;
}

return true;
  }

  clearOccurrences(): void
  {
    occurrenceService.clearOperationOccurrences();
    occurrenceCoordinator.clear();
    travelProspectService.clear();
    stationaryTimeProspectService.clear();
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
        occurrenceService.remove(occurrence.id);

        return true;

      case 'none':
        occurrenceService.remove(occurrence.id);

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

    const prospect =
      occurrenceCoordinator.getProspect(occurrence.pieceId);

    if (prospect?.kind === 'stationary-time')
    {
      const stationaryProspect =
        stationaryTimeProspectService
          .getProspect(occurrence.pieceId);

      if (!stationaryProspect)
      {
        throw new Error(
          `Piece "${occurrence.pieceId}" has no stationary time prospect.`
        );
      }

      stationaryTimeProspectService
        .setStorageCursor(
          occurrence.pieceId,
          occurrence.simulationTime
        );

      occurrenceCoordinator.removeRound(
        occurrence.pieceId
      );

      await hostEventBroker.requestModule(
        'regions',
        'Regions.ContinueProgressTime',
        {
          pieceId:
            occurrence.pieceId,
          startTime:
            occurrence.simulationTime,
          targetTime:
            stationaryProspect.targetTime,
        }
      );

      return;
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
      typeof payload.distanceFromLegStart === 'number'
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

        const stationaryProspect =
      stationaryTimeProspectService
        .getProspect(
          occurrence.pieceId
        );

    if (
      stationaryProspect &&
      !stationaryProspect.complete
    )
    {
      occurrenceService.truncatePiece(
        occurrence.pieceId,
        occurrence.simulationTime
      );

      occurrenceService.remove(
        occurrence.id
      );

      stationaryTimeProspectService
        .setStorageCursor(
          occurrence.pieceId,
          occurrence.simulationTime
        );

      await hostEventBroker.requestModule(
        'regions',
        'Regions.ContinueProgressTime',
        {
          pieceId:
            occurrence.pieceId,
          startTime:
            occurrence.simulationTime,
          targetTime:
            stationaryProspect.targetTime,
        }
      );

      return true;
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