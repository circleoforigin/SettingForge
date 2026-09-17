export type OverlayEdge =
  | 'top'
  | 'bottom';

export type OverlayAlignment =
  | 'left'
  | 'center'
  | 'right';

export interface OverlayPlacement {
  edge: OverlayEdge;
  alignment: OverlayAlignment;
}