import {
  OVERLAY_PLACEMENTS,
  type OverlayPlacementIndex,
} from './OverlayPlacement';

export interface ActiveOverlay
{
  overlayId: string;
  placementIndex: OverlayPlacementIndex;
}

function getAvailablePlacementIndexes(): OverlayPlacementIndex[]
{
  return Object.keys(OVERLAY_PLACEMENTS)
    .map(Number)
    .filter((index) => index in OVERLAY_PLACEMENTS) as OverlayPlacementIndex[];
}

function isValidPlacementIndex(
  placementIndex: number
): placementIndex is OverlayPlacementIndex
{
  return placementIndex in OVERLAY_PLACEMENTS;
}

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

    const placementIndex = getAvailablePlacementIndexes().find(
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

    restore(
    overlayId: string,
    placementIndex: number
  ): ActiveOverlay | undefined
  {
    if (!isValidPlacementIndex(placementIndex))
    {
      return undefined;
    }

    const occupied =
      this.getAllActive().some(
        (overlay) =>
          overlay.placementIndex ===
          placementIndex
      );

    if (occupied)
    {
      return undefined;
    }

    const active: ActiveOverlay = {
      overlayId,
      placementIndex,
    };

    this.activeOverlays.set(
      overlayId,
      active
    );

    return active;
  }


  setPlacement(
    overlayId: string,
    placementIndex: OverlayPlacementIndex
  ): ActiveOverlay | undefined
  {
    if (!isValidPlacementIndex(placementIndex))
    {
        return undefined;
    }
    
    const activeOverlay =
        this.activeOverlays.get(overlayId);

    if (!activeOverlay)
    {
        return undefined;
    }

    const occupied =
        this.getAllActive().some(
        (overlay) =>
            overlay.overlayId !== overlayId &&
            overlay.placementIndex === placementIndex
        );

    if (occupied)
    {
        return undefined;
    }

    const updatedOverlay: ActiveOverlay = {
        ...activeOverlay,
        placementIndex,
    };

    this.activeOverlays.set(
        overlayId,
        updatedOverlay
    );

    return updatedOverlay;
  }

  clear(): void
  {
    this.activeOverlays.clear();
  }


  disable(overlayId: string): void
  {
    this.activeOverlays.delete(overlayId);
  }
}