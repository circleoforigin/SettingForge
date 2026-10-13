import {
  OVERLAY_MOUNTS,
  type OverlayMountId,
} from './OverlayPlacement';

export interface ActiveOverlay
{
  overlayId: string;
  mountId: OverlayMountId;
}

function isValidMountId(
  mountId: string
): mountId is OverlayMountId
{
  return mountId in OVERLAY_MOUNTS;
}

export class OverlayManager
{
  private activeOverlays =
    new Map<string, ActiveOverlay>();

  getActive(
    overlayId: string
  ): ActiveOverlay | undefined
  {
    return this.activeOverlays.get(
      overlayId
    );
  }

  getAllActive(): ActiveOverlay[]
  {
    return Array.from(
      this.activeOverlays.values()
    );
  }

  isActive(
    overlayId: string
  ): boolean
  {
    return this.activeOverlays.has(
      overlayId
    );
  }

  enable(
    overlayId: string,
    defaultMount: OverlayMountId,
    allowedMounts: readonly OverlayMountId[]
  ): ActiveOverlay | undefined
  {
    const existing =
      this.activeOverlays.get(
        overlayId
      );

    if (existing)
    {
      return existing;
    }

    if (
      !allowedMounts.includes(
        defaultMount
      )
    )
    {
      return undefined;
    }

    const mountId =
      this.resolveAvailableMount(
        defaultMount,
        allowedMounts
      );

    if (!mountId)
    {
      return undefined;
    }

    const activeOverlay: ActiveOverlay = {
      overlayId,
      mountId,
    };

    this.activeOverlays.set(
      overlayId,
      activeOverlay
    );

    return activeOverlay;
  }

  restore(
    overlayId: string,
    mountId: string,
    allowedMounts: readonly OverlayMountId[]
  ): ActiveOverlay | undefined
  {
    if (
      !isValidMountId(mountId) ||
      !allowedMounts.includes(mountId) ||
      !this.canUseMount(
        overlayId,
        mountId
      )
    )
    {
      return undefined;
    }

    const activeOverlay: ActiveOverlay = {
      overlayId,
      mountId,
    };

    this.activeOverlays.set(
      overlayId,
      activeOverlay
    );

    return activeOverlay;
  }

  setMount(
    overlayId: string,
    mountId: OverlayMountId,
    allowedMounts: readonly OverlayMountId[]
  ): ActiveOverlay | undefined
  {
    const activeOverlay =
      this.activeOverlays.get(
        overlayId
      );

    if (
      !activeOverlay ||
      !allowedMounts.includes(mountId) ||
      !this.canUseMount(
        overlayId,
        mountId
      )
    )
    {
      return undefined;
    }

    const updatedOverlay: ActiveOverlay = {
      ...activeOverlay,
      mountId,
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

  disable(
    overlayId: string
  ): void
  {
    this.activeOverlays.delete(
      overlayId
    );
  }

  private resolveAvailableMount(
    defaultMount: OverlayMountId,
    allowedMounts: readonly OverlayMountId[]
  ): OverlayMountId | undefined
  {
    if (
      this.canUseMount(
        '',
        defaultMount
      )
    )
    {
      return defaultMount;
    }

    return allowedMounts.find(
      (mountId) =>
        this.canUseMount(
          '',
          mountId
        )
    );
  }

  private canUseMount(
    overlayId: string,
    mountId: OverlayMountId
  ): boolean
  {
    const mount =
      OVERLAY_MOUNTS[mountId];

    if (mount.kind === 'stack')
    {
      return true;
    }

    return !this.getAllActive().some(
      (overlay) =>
        overlay.overlayId !==
          overlayId &&
        overlay.mountId === mountId
    );
  }
}