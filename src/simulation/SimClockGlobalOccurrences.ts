import {
  hostEventBroker,
} from '../events/HostEventBroker';
import {
  occurrenceService,
} from '../overlays/occurrence/OccurrenceService';
import {
  generateSimClockOccurrences,
} from './SimClockOccurrenceGenerator';
import type {
  SimClockEra,
  SimClockMarkers,
} from './SimClockSettings';

export const GLOBAL_OCCURRENCE_HORIZON_HOURS =
  48;

export interface SimClockGlobalOccurrenceSettings
{
  markers: SimClockMarkers;
  era: SimClockEra;
}

function getHorizonEnd(
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

  occurrenceService.replaceGlobal(
    generateSimClockOccurrences(
      startTime,
      endTime,
      settings.markers,
      settings.era
    )
  );

  hostEventBroker.broadcast(
    'SimClock.BuildGlobal',
    {
      startTime,
      endTime,
    }
  );
}