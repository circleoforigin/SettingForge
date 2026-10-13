import type { SimClockSettings } from '../simulation/SimClockSettings';
import type { OverlayMountId } from '../overlays/OverlayPlacement';

export interface WorldModuleReference {
  moduleId: string;
  projectId: string;
}

export interface WorldRulesetReference {
  rulesetId: string;
  version: string;
}

export interface WorldOverlayState
{
  overlayId: string;
  mountId?: OverlayMountId;
}

export interface WorldSimulationState
{
  time: number;
  simClockSettings: SimClockSettings;
}

export interface World {
  id: string;
  name: string;
  modules: WorldModuleReference[];
  ruleset?: WorldRulesetReference;

  simulation?: WorldSimulationState;
  overlays?: WorldOverlayState[];

  createdAt: Date;
  updatedAt: Date;
}