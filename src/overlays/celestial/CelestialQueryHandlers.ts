import type { HostRequestMessage } from '../../events/HostMessage';
import type { SimClockEra } from '../../simulation/SimClockSettings';
import { celestialService } from '../../simulation/CelestialService';
import { generateCelestialOccurrences } from '../../simulation/CelestialOccurrenceGenerator';

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

interface GenerateOccurrencesPayload
{
  startTime: number;
  endTime: number;
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

    const unregisterGenerateOccurrences =
  registerRequestHandler(
    'Celestial.GenerateOccurrences',
    async (message) =>
    {
      const payload =
        message.payload as
          Partial<GenerateOccurrencesPayload>
          | undefined;

      if (
        !payload ||
        typeof payload.startTime !== 'number' ||
        !Number.isFinite(payload.startTime) ||
        typeof payload.endTime !== 'number' ||
        !Number.isFinite(payload.endTime) ||
        !payload.era ||
        typeof payload.era !== 'object'
      )
      {
        throw new Error(
          'Celestial.GenerateOccurrences received invalid input.'
        );
      }

      return {
        occurrences:
          generateCelestialOccurrences(
            payload.startTime,
            payload.endTime,
            payload.era
          ),
      };
    }
  );

return () =>
{
  unregisterGenerateOccurrences();
  unregisterResolveMarker();
};
}