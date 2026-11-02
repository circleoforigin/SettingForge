import { hostEventBroker } from '../events/HostEventBroker';
import type {
  SimClockEra,
  SimClockMarkers,
} from './SimClockSettings';

export const GLOBAL_OCCURRENCE_HORIZON_HOURS = 100;
let globalForecastEnd: number | undefined;

let globalOccurrenceRequestVersion = 0;

export function invalidateGlobalOccurrenceRequests(): number
{
  globalOccurrenceRequestVersion += 1;

  return globalOccurrenceRequestVersion;
}

export function isCurrentGlobalOccurrenceRequest(
  version: number
): boolean
{
  return version === globalOccurrenceRequestVersion;
}

export interface SimClockGlobalOccurrenceSettings
{
  markers: SimClockMarkers;
  era: SimClockEra;
}

export function getHorizonEnd(
  startTime: number,
  era: SimClockEra
): number
{
  const secondsPerHour =
    era.secondsPerMinute *
    era.minutesPerHour;

  return (
    startTime +
    GLOBAL_OCCURRENCE_HORIZON_HOURS *
      secondsPerHour
  );
}

export function rebuildGlobalOccurrences(
  startTime: number,
  settings: SimClockGlobalOccurrenceSettings
): void
{
  const endTime =
    getHorizonEnd(
      startTime,
      settings.era
    );

  globalForecastEnd = endTime;

hostEventBroker.broadcast(
  'SimClock.BuildGlobal',
  {
    mode: 'rebuild',
    startTime,
    endTime,
    era: settings.era,
  }
);
}

export function extendGlobalOccurrences(
  currentTime: number,
  settings: SimClockGlobalOccurrenceSettings
): void
{
  const targetEnd =
    getHorizonEnd(
      currentTime,
      settings.era
    );

const currentEnd =
  globalForecastEnd ?? currentTime;

if (currentEnd >= targetEnd)
{
  return;
}

globalForecastEnd = targetEnd;

  if (currentEnd >= targetEnd)
  {
    return;
  }

hostEventBroker.broadcast(
  'SimClock.BuildGlobal',
  {
    mode: 'extend',
    startTime: currentEnd,
    endTime: targetEnd,
    era: settings.era,
  }
);
}