import type { World } from '../models/World';

export interface ProjectWorldOwnership {
  worldId: string
  worldName: string
  moduleId: string
  projectId: string
}

const WORLDS_COLLECTION = 'worlds';
const HOST_ID = 'settingforge';

export class WorldRepository {
  async loadWorlds(): Promise<World[]> {
    const worlds = await window.settingForge.storage.read(
      HOST_ID,
      WORLDS_COLLECTION
    );

    return Array.isArray(worlds)
      ? worlds as World[]
      : [];
  }

  async findProjectOwner(
  moduleId: string,
  projectId: string,
): Promise<ProjectWorldOwnership | null> {
  const worlds =
    await this.loadWorlds()

  for (const world of worlds) {
    const ownsProject =
      world.modules.some(
        (moduleReference) =>
          moduleReference.moduleId ===
            moduleId &&
          moduleReference.projectId ===
            projectId,
      )

    if (!ownsProject) {
      continue
    }

    return {
      worldId:
        world.id,

      worldName:
        world.name,

      moduleId,

      projectId,
    }
  }

  return null
}

  async loadWorld(worldId: string): Promise<World | null> {
    const world = await window.settingForge.storage.read(
      HOST_ID,
      WORLDS_COLLECTION,
      worldId
    );

    return world as World | null;
  }

  async saveWorld(world: World): Promise<void> {
    await window.settingForge.storage.write(
      HOST_ID,
      WORLDS_COLLECTION,
      world.id,
      world
    );
  }

  async deleteWorld(worldId: string): Promise<boolean> {
    return window.settingForge.storage.delete(
      HOST_ID,
      WORLDS_COLLECTION,
      worldId
    );
  }
}

export const worldRepository = new WorldRepository();