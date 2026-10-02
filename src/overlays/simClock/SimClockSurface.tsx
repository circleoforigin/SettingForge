import type { OverlaySurfaceProps } from '../OverlayDefinition';
import { OVERLAY_PLACEMENTS } from '../OverlayPlacement';

export function SimClockSurface({
  placement,
}: OverlaySurfaceProps)
{
  const resolvedPlacement =
    OVERLAY_PLACEMENTS[placement.index];

  return (
    <div
      className="sim-clock-surface"
      data-edge={resolvedPlacement.edge}
      data-alignment={resolvedPlacement.alignment}
    >
      SimClock
    </div>
  );
}