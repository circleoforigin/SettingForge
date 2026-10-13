export type OverlayMountId =
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type OverlayMountKind =
  | 'exclusive'
  | 'stack';

export interface OverlayMountDefinition
{
  id: OverlayMountId;
  kind: OverlayMountKind;
}

export const OVERLAY_MOUNTS:
  Record<
    OverlayMountId,
    OverlayMountDefinition
  > = {
    'middle-left': {
      id: 'middle-left',
      kind: 'exclusive',
    },

    'middle-right': {
      id: 'middle-right',
      kind: 'exclusive',
    },

    'bottom-left': {
      id: 'bottom-left',
      kind: 'stack',
    },

    'bottom-center': {
      id: 'bottom-center',
      kind: 'stack',
    },

    'bottom-right': {
      id: 'bottom-right',
      kind: 'stack',
    },
  };

/*
 * Legacy placement types remain
 * temporarily while existing Overlay
 * surfaces are migrated to mounts.
 */
export type OverlayPlacementIndex =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5;

export interface OverlayPlacement
{
  index: OverlayPlacementIndex;
}

export const OVERLAY_PLACEMENTS: Record<
  OverlayPlacementIndex,
  {
    edge: 'top' | 'bottom';
    alignment: 'left' | 'center' | 'right';
  }
> = {
  0: {
    edge: 'top',
    alignment: 'left',
  },

  1: {
    edge: 'top',
    alignment: 'center',
  },

  2: {
    edge: 'top',
    alignment: 'right',
  },

  3: {
    edge: 'bottom',
    alignment: 'left',
  },

  4: {
    edge: 'bottom',
    alignment: 'center',
  },

  5: {
    edge: 'bottom',
    alignment: 'right',
  },
};