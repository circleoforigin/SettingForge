import type { ComponentType } from 'react';

export interface OverlayDefinition {
  id: string;
  name: string;
  description: string;
  version: string;

  Surface: ComponentType;
}