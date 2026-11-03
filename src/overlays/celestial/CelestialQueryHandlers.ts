import type { HostRequestMessage } from '../../events/HostMessage';
import type { SimClockEra } from '../../simulation/SimClockSettings';
import { celestialService } from '../../simulation/CelestialService';
import { generateCelestialOccurrences } from '../../simulation/CelestialOccurrenceGenerator';
import { hostEventBroker } from '../../events/HostEventBroker';
import {
  OccurrenceReactions,
  type Occurrence,
} from '@settingforge/module-sdk';

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

interface GlobalOccurrencesRequestedPayload
{
  startTime: number;
  endTime: number;
  era: SimClockEra;
}

async function submitCelestialOccurrences(
  startTime: number,
  endTime: number,
  era: SimClockEra
): Promise<void>
{
 const prospectEndTime = endTime;

 const occurrences =
  generateCelestialOccurrences(
    startTime,
    prospectEndTime,
    era
  ); 

  const completion: Occurrence = {
    id: crypto.randomUUID(),
    sourceModuleId: 'overlay:celestial',
    simulationTime: prospectEndTime,
    pieceId: null,
    entityId: null,
    sectorId: null,
    reaction: OccurrenceReactions.None,
  };

await hostEventBroker.requestHost(
  'overlay:celestial',
  'occurrences.submit',
  {
    pieceId: null,
    occurrences: [
      ...occurrences,
      completion,
    ],
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

const unsubscribeGlobalRequested =
  hostEventBroker.subscribe(
    'Simulation.GlobalOccurrencesRequested',
    (message) =>
    {
      const payload =
        message.payload as
          Partial<GlobalOccurrencesRequestedPayload>
          | undefined;

      if (
        !payload ||
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
        payload.startTime,
        payload.endTime,
        payload.era
      ).catch(
        (error: unknown) =>
        {
          console.error(
            '[Celestial] Unable to prospect Occurrences.',
            error
          );
        }
      );
    }
  );

return () =>
{
  unsubscribeGlobalRequested();
  unregisterResolveMarker();
};
}