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