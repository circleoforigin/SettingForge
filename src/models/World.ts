export interface WorldModuleReference {
  moduleId: string;
  projectId: string;
}

export interface World {
  id: string;
  name: string;
  modules: WorldModuleReference[];
  createdAt: Date;
  updatedAt: Date;
}