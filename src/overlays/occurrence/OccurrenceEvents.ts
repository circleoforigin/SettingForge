import type { HostEventMessage } from '../../events/HostMessage';
import type { OverlayEventHandler } from '../OverlayDefinition';
import { occurrenceCoordinator } from './OccurrenceCoordinator';

function handleTravelLegProspected(
  message: HostEventMessage
): void
{
  const payload =
    message.payload as
      | {
          pieceId?: string;
          routeLegId?: string;
          endTime?: number;
        }
      | undefined;

  if (!payload?.pieceId)
  {
    return;
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