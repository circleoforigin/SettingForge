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
  placementIndex?: number;
}

export interface WorldSimulationState
{
  time: number;
  simClockSettings?: unknown;
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