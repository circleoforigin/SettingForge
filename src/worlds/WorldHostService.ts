
import type {
  HostRequestMessage,
} from '@settingforge/module-sdk';

import type {
  World,
} from '../models/World';

type RegisterRequestHandler = (
  type: string,
  handler: (
    message: HostRequestMessage
  ) => Promise<unknown>
) => () => void;

export function registerWorldHostService(
  registerRequestHandler: RegisterRequestHandler,
  getActiveWorld: () => World | null
): () => void
{
  return registerRequestHandler(
    'world.getSeed',
    async () =>
    {
      const world = getActiveWorld();

      if (!world)
      {
        throw new Error(
          'No World is currently active.'
        );
      }

      if (
        !Number.isSafeInteger(world.seed) ||
        world.seed === undefined ||
        world.seed < 0 ||
        world.seed > 0xFFFFFFFF
      )
      {
        throw new Error(
          'The active World has no valid seed.'
        );
      }

      return {
        worldId: world.id,
        seed: world.seed,
      };
    }
  );
}
