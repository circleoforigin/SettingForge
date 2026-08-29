import type { World } from '../models/World';

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