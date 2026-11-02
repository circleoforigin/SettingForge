import type { HostEventMessage } from '../../events/HostMessage';
import type { OverlayEventHandler } from '../OverlayDefinition';
import type { CelestialMarker } from '../../simulation/CelestialMarkers';
import { simClockMarkerState } from './SimClockMarkerState';

function handleCelestialMarkersChanged(
  message: HostEventMessage
): void
{
  const payload = message.payload as
    | {
        markers?: CelestialMarker[];
      }
    | undefined;

  if (!Array.isArray(payload?.markers))
  {
    return;
  }

  simClockMarkerState.setMarkers(payload.markers);
}

export const simClockEventHandlers:
  OverlayEventHandler[] = [
    {
      type: 'Celestial.MarkersChanged',
      handle: handleCelestialMarkersChanged,
    },
  ];