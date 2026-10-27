import { createSeed } from '@settingforge/module-sdk';

import type { World } from '../models/World';

export function ensureWorldSeed(
  world: World
): {
  world: World;
  migrated: boolean;
}
{
  if (
    Number.isSafeInteger(world.seed) &&
    world.seed !== undefined &&
    world.seed >= 0 &&
    world.seed <= 0xFFFFFFFF
  )
  {
    return {
      world,
      migrated: false,
    };
  }

  return {
    world: {
      ...world,
      seed: createSeed(world.name),
    },
    migrated: true,
  };
}