import type { ComponentType } from 'react';
import type { OverlayPlacement } from './OverlayPlacement';

export type OverlayLayout =
  | 'positioned'
  | 'fixed';

export interface OverlaySurfaceProps
{
  placement: OverlayPlacement;
  tabs?: {
    id: string;
    name: string;
    phoneNumber: string;
  }[];
}

export interface OverlayDefinition
{
  id: string;
  name: string;
  description: string;
  version: string;
  layout: OverlayLayout;
  Surface?: ComponentType<OverlaySurfaceProps>;
}