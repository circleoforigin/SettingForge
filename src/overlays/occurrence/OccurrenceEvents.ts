import type { HostEventMessage } from '../../events/HostMessage';
import type { OverlayEventHandler } from '../OverlayDefinition';
import { occurrenceCoordinator } from './OccurrenceCoordinator';
import { occurrenceService } from './OccurrenceService';
import { travelProspectService } from '../../simulation/TravelProspectService';
import { stationaryTimeProspectService } from '../../simulation/StationaryTimeProspectService';

function handleTravelLegProspected(
  message: HostEventMessage
): void
{
  const payload =
    message.payload as
      | {
          pieceId?: string;
          routeLegId?: string;
          startTime?: number;
          endTime?: number;
          startDistanceFromLegStart?: number;
          endDistanceFromLegStart?: number;
        }
      | undefined;

  if (!payload?.pieceId)
  {
    return;
  }

  if (
    payload.routeLegId &&
    typeof payload.startTime === 'number' &&
    typeof payload.endTime === 'number' &&
    typeof payload.startDistanceFromLegStart ===
      'number' &&
    typeof payload.endDistanceFromLegStart ===
      'number'
  )
  {
    travelProspectService.addInterval(
      payload.pieceId,
      {
        routeLegId: payload.routeLegId,
        startTime: payload.startTime,
        endTime: payload.endTime,
        startDistanceFromLegStart:
          payload.startDistanceFromLegStart,
        endDistanceFromLegStart:
          payload.endDistanceFromLegStart,
      }
    );

    occurrenceService
        .setPresentationThroughTime(payload.endTime);
  }

  if (
    payload.routeLegId &&
    typeof payload.endTime === 'number'
  )
  {
    occurrenceCoordinator.setProspectLeg(
      payload.pieceId,
      payload.routeLegId,
      payload.endTime
    );
  }

  occurrenceCoordinator.beginRound(payload.pieceId);
}

function handleTimeProspected(
  message: HostEventMessage
): void
{
  const payload =
    message.payload as
      | {
          pieceId?: string;
          startTime?: number;
          endTime?: number;
        }
      | undefined;

  if (
    !payload?.pieceId ||
    typeof payload.startTime !==
      'number' ||
    typeof payload.endTime !==
      'number'
  )
  {
    return;
  }

  const existing =
    stationaryTimeProspectService.getProspect(
      payload.pieceId
    );

  if (!existing)
  {
    stationaryTimeProspectService.begin(
      payload.pieceId,
      payload.startTime,
      payload.endTime
    );
  }

  occurrenceCoordinator
    .setProspectStationaryTime(
      payload.pieceId,
      existing?.targetTime ??
        payload.endTime
    );

  occurrenceCoordinator.beginRound(
    payload.pieceId
  );
}

export const occurrenceEventHandlers: OverlayEventHandler[] = [
  {
    type: 'Regions.TravelLegProspected',
    handle: handleTravelLegProspected,
  },
  {
    type: 'Regions.TimeProspected',
    handle: handleTimeProspected,
  },
];