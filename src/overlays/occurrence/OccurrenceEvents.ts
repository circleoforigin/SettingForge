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
        }
      | undefined;

  if (!payload?.pieceId)
  {
    return;
  }

  occurrenceCoordinator.beginRound(
    payload.pieceId
  );
}

export const occurrenceEventHandlers: OverlayEventHandler[] = [
  {
    type: 'Regions.TravelLegProspected',
    handle: handleTravelLegProspected,
  },
];