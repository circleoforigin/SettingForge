import type { HostEventMessage } from '../../events/HostMessage';
import type { OverlayEventHandler } from '../OverlayDefinition';
import { occurrenceCoordinator } from './OccurrenceCoordinator';
import { travelProspectService } from '../../simulation/TravelProspectService';

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

export const occurrenceEventHandlers: OverlayEventHandler[] = [
  {
    type: 'Regions.TravelLegProspected',
    handle: handleTravelLegProspected,
  },
];