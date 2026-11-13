import type { HostRequestMessage } from '../../events/HostMessage';
import type { SimClockEra } from '../../simulation/SimClockSettings';
import {
  calendarToSimulationTime,
  getMonthDays,
} from '../../simulation/SimCalendar';
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

interface GetSeasonCalendarPayload
{
  year: number;
  era: SimClockEra;
}

interface SeasonCalendarAnchor
{
  monthId: string;
  day: number;
  time: number;
}

interface SeasonCalendarStart
  extends SeasonCalendarAnchor
{
  seasonId: string;
}

interface SeasonCalendarYear
{
  year: number;
  starts: SeasonCalendarStart[];
  shortSolstice?: SeasonCalendarAnchor;
  longSolstice?: SeasonCalendarAnchor;
}

interface GlobalOccurrencesRequestedPayload
{
  requestId: string;
  startTime: number;
  endTime: number;
  era: SimClockEra;
}

async function submitCelestialOccurrences(
  requestId: string,
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
    requestId,
    pieceId: null,
    occurrences: [
      ...occurrences,
      completion,
    ],
  }
);
}

function getSeasonCalendar(
  year: number,
  era: SimClockEra
): SeasonCalendarYear
{
  const settings =
    celestialService.getSettings();

  const resolveDate = (
    monthId: string,
    day: number
  ): SeasonCalendarAnchor | undefined =>
  {
    const month = era.months.find(
      item => item.id === monthId
    );

    if (
      !month ||
      !Number.isInteger(day) ||
      day < 1 ||
      day > getMonthDays(month, year, era)
    )
    {
      return undefined;
    }

    return {
      monthId,
      day,
      time: calendarToSimulationTime(
        {
          year,
          monthId,
          day,
          hour: 0,
          minute: 0,
          second: 0,
        },
        era
      ),
    };
  };

  const starts =
    settings.seasonStarts.flatMap(
      start =>
      {
        const resolved =
          resolveDate(start.monthId, start.day);

        return resolved
          ? [{
              seasonId: start.seasonId,
              ...resolved,
            }]
          : [];
      }
    ).sort(
      (a, b) => a.time - b.time
    );

  return {
    year,
    starts,

    shortSolstice: resolveDate(
      settings.solarCycle.shortSolstice.monthId,
      settings.solarCycle.shortSolstice.day
    ),

    longSolstice: resolveDate(
      settings.solarCycle.longSolstice.monthId,
      settings.solarCycle.longSolstice.day
    ),
  };
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
    
    const unregisterGetSeasonCalendar =
  registerRequestHandler(
    'Celestial.GetSeasonCalendar',
    async (message) =>
    {
      const payload =
        message.payload as
          Partial<GetSeasonCalendarPayload>
          | undefined;

      if (
        !payload ||
        typeof payload.year !== 'number' ||
        !Number.isInteger(payload.year) ||
        !payload.era ||
        !Array.isArray(payload.era.months) ||
        payload.era.months.length === 0
      )
      {
        throw new Error(
          'Celestial.GetSeasonCalendar received invalid input.'
        );
      }

      const year = payload.year;

      return {
        previous: getSeasonCalendar(
          year - 1,
          payload.era
        ),
        current: getSeasonCalendar(
          year,
          payload.era
        ),
        next: getSeasonCalendar(
          year + 1,
          payload.era
        ),
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
        typeof payload.requestId !== 'string' ||
        !payload.requestId ||
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
        payload.requestId,
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
  unregisterGetSeasonCalendar();
};
}