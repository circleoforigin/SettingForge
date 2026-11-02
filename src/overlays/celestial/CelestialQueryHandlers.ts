import type { HostRequestMessage } from '../../events/HostMessage';
import type { SimClockEra } from '../../simulation/SimClockSettings';
import { celestialService } from '../../simulation/CelestialService';
import { generateCelestialOccurrences } from '../../simulation/CelestialOccurrenceGenerator';
import { hostEventBroker } from '../../events/HostEventBroker';

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

interface BuildGlobalOccurrencesPayload
{
  mode: 'rebuild' | 'extend';
  startTime: number;
  endTime: number;
  era: SimClockEra;
}

async function submitCelestialOccurrences(
  mode: 'rebuild' | 'extend',
  startTime: number,
  endTime: number,
  era: SimClockEra
): Promise<void>
{
  const occurrences =
    generateCelestialOccurrences(
      startTime,
      endTime,
      era
    );

  const requestType =
    mode === 'rebuild'
      ? 'occurrences.replaceGlobal'
      : 'occurrences.submit';

  await hostEventBroker.requestHost(
    'overlay:celestial',
    requestType,
    {
      pieceId: null,
      occurrences,
    }
  );
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

    const unsubscribeBuildGlobal =
    hostEventBroker.subscribe(
      'SimClock.BuildGlobal',
      (message) =>
      {
        const payload =
          message.payload as
            Partial<BuildGlobalOccurrencesPayload>
            | undefined;

if (
  !payload ||
  (
    payload.mode !== 'rebuild' &&
    payload.mode !== 'extend'
  ) ||
  typeof payload.startTime !== 'number' ||
  !Number.isFinite(payload.startTime) ||
  typeof payload.endTime !== 'number' ||
  !Number.isFinite(payload.endTime) ||
  payload.endTime <= payload.startTime ||
  !payload.era ||
  typeof payload.era !== 'object'
)
{
  return;
}

void submitCelestialOccurrences(
  payload.mode,
  payload.startTime,
  payload.endTime,
  payload.era
).catch(
  (error: unknown) =>
  {
    console.error(
      '[Celestial] Unable to submit global Occurrences.',
      error
    );
  }
);
      }
    );

return () =>
{
  unsubscribeBuildGlobal();
  unregisterResolveMarker();
};
}