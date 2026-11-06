import { hostEventBroker } from '../events/HostEventBroker';
import type {
  SimClockEra,
  SimClockMarkers,
} from './SimClockSettings';

export const GLOBAL_OCCURRENCE_HORIZON_HOURS = 100;
let globalForecastEnd: number | undefined;
let lastForecastTime: number | undefined;

export function resetGlobalOccurrenceForecast(): void
{
  globalForecastEnd = undefined;
  lastForecastTime = undefined;
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

  lastForecastTime = startTime;  
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
  if (
    lastForecastTime !== undefined &&
    currentTime < lastForecastTime
  )
  {
    rebuildGlobalOccurrences(
      currentTime,
      settings
    );

    return;
  }

  lastForecastTime = currentTime;

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