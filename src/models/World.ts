import type { SimClockSettings } from '../simulation/SimClockSettings';
import type { OverlayMountId } from '../overlays/OverlayPlacement';
import type {
  EnvironmentSettings,
  EnvironmentState,
} from '../simulation/EnvironmentSettings';
import type { EnvironmentDefinitionOverrides } from '../simulation/EnvironmentDefinitions';

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

  /*
   * Legacy Overlay position.
   * Read only for World migration.
   */
  placementIndex?: number;
}

export interface WorldSimulationState
{
  time: number;
  simClockSettings: SimClockSettings;

  environmentSettings?: EnvironmentSettings;
  environmentState?: EnvironmentState;

  environmentDefinitionOverrides?: EnvironmentDefinitionOverrides;
}

export interface World {
  id: string;
  name: string;
  seed?: number;
  modules: WorldModuleReference[];
  ruleset?: WorldRulesetReference;

  simulation?: WorldSimulationState;
  overlays?: WorldOverlayState[];

  createdAt: Date;
  updatedAt: Date;
}