import type { OverlayPlacementIndex } from './OverlayPlacement';

export interface ActiveOverlay
{
  overlayId: string;
  placementIndex: OverlayPlacementIndex;
}

const OVERLAY_PLACEMENT_INDEXES: OverlayPlacementIndex[] = [
  0,
  1,
  2,
  3,
  4,
  5,
];

export class OverlayManager
{
  private activeOverlays = new Map<string, ActiveOverlay>();

  getActive(overlayId: string): ActiveOverlay | undefined
  {
    return this.activeOverlays.get(overlayId);
  }

  getAllActive(): ActiveOverlay[]
  {
    return Array.from(this.activeOverlays.values());
  }

  isActive(overlayId: string): boolean
  {
    return this.activeOverlays.has(overlayId);
  }

  enable(overlayId: string): ActiveOverlay | undefined
  {
    const existing = this.activeOverlays.get(overlayId);

    if (existing)
    {
      return existing;
    }

    const occupiedIndexes = new Set(
      this.getAllActive().map((overlay) => overlay.placementIndex)
    );

    const placementIndex = OVERLAY_PLACEMENT_INDEXES.find(
      (index) => !occupiedIndexes.has(index)
    );

    if (placementIndex === undefined)
    {
      return undefined;
    }

    const activeOverlay: ActiveOverlay = {
      overlayId,
      placementIndex,
    };

    this.activeOverlays.set(overlayId, activeOverlay);

    return activeOverlay;
  }

  disable(overlayId: string): void
  {
    this.activeOverlays.delete(overlayId);
  }
}