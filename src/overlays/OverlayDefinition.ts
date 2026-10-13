import type { ComponentType } from 'react';
import type { HostEventMessage } from '../events/HostMessage';
import type {
  OverlayMountId,
  OverlayPlacement,
} from './OverlayPlacement';

export type OverlayLayout =
  | 'positioned'
  | 'fixed';

export interface OverlaySurfaceProps
{
  mountId?: OverlayMountId;

  /*
   * Legacy surface placement.
   * Remove once all positioned Overlay
   * surfaces render from mountId.
   */
  placement?: OverlayPlacement;

  tabs?: {
    id: string;
    name: string;
    phoneNumber: string;
  }[];
}

export interface OverlayEventHandler
{
  type: string;
  handle: (message: HostEventMessage) => void;
}

interface OverlayDefinitionBase
{
  id: string;
  name: string;
  description: string;
  version: string;
  Surface?: ComponentType<OverlaySurfaceProps>;
  events?: OverlayEventHandler[];
}

export interface PositionedOverlayDefinition
  extends OverlayDefinitionBase
{
  layout: 'positioned';

  /*
   * Mounts this Overlay's presentation
   * has been designed to support.
   */
  allowedMounts: readonly OverlayMountId[];

  /*
   * Initial mount used when the Overlay
   * is enabled without a saved assignment.
   *
   * Must also appear in allowedMounts.
   */
  defaultMount: OverlayMountId;
}

export interface FixedOverlayDefinition
  extends OverlayDefinitionBase
{
  layout: 'fixed';
}

export type OverlayDefinition =
  | PositionedOverlayDefinition
  | FixedOverlayDefinition;