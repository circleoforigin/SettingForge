import type { ComponentType } from 'react';
import type {
  OverlayPlacement,
} from './OverlayPlacement';

export interface OverlaySurfaceProps {
  placement: OverlayPlacement;
}

export interface OverlayDefinition {
  id: string;
  name: string;
  description: string;
  version: string;

  Surface: ComponentType<OverlaySurfaceProps>;
}