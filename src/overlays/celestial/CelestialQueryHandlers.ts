import type {
  HostRequestMessage,
} from '../../events/HostMessage';

import type {
  SimClockEra,
} from '../../simulation/SimClockSettings';

import {
  celestialService,
} from '../../simulation/CelestialService';

type RegisterRequestHandler = (
  type: string,
  handler: (
    message: HostRequestMessage
  ) => Promise<unknown>
) => () => void;

interface ResolveMarkerPayload
{
  markerId: string;
  afterTime: number;
  era: SimClockEra;
}

export function registerCelestialQueryHandlers(
  registerRequestHandler: RegisterRequestHandler
): () => void
{
  const unregisterResolveMarker =
    registerRequestHandler(
      'Celestial.ResolveMarker',
      async (message) =>
      {
        const payload =
          message.payload as
            Partial<ResolveMarkerPayload>
            | undefined;

        if (
          !payload ||
          typeof payload.markerId !== 'string' ||
          !payload.markerId ||
          typeof payload.afterTime !== 'number' ||
          !Number.isFinite(payload.afterTime) ||
          !payload.era ||
          typeof payload.era !== 'object'
        )
        {
          throw new Error(
            'Celestial.ResolveMarker received invalid input.'
          );
        }

        const targetTime =
          celestialService.resolveMarker(
            payload.markerId,
            payload.afterTime,
            payload.era
          );

        return targetTime === undefined
          ? {}
          : {
              targetTime,
            };
      }
    );

  return () =>
  {
    unregisterResolveMarker();
  };
}