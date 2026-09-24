export interface WorldModuleReference {
  moduleId: string;
  projectId: string;
}

export interface WorldRulesetReference {
  rulesetId: string;
  version: string;
}

export interface World {
  id: string;
  name: string;
  modules: WorldModuleReference[];
  ruleset?: WorldRulesetReference;
  createdAt: Date;
  updatedAt: Date;
}