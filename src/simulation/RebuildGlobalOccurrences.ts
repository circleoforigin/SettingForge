import type {
  Occurrence,
} from '@settingforge/module-sdk';
import {
  simulationClockService,
} from './SimulationClockService';
import {
  generateSimClockOccurrences,
} from './SimClockOccurrenceGenerator';
import type {
  SimClockEra,
  SimClockMarkers,
} from './SimClockSettings';
import {
  GLOBAL_OCCURRENCE_HORIZON_HOURS,
  globalOccurrenceTimeline,
} from './GlobalOccurrenceTimeline';

export interface RebuildGlobalOccurrencesOptions
{
  markers: SimClockMarkers;
  era: SimClockEra;
}

export function RebuildGlobalOccurrences(
  options: RebuildGlobalOccurrencesOptions
): void
{
  const startTime =
    simulationClockService.getTime();

  const secondsPerHour =
    options.era.secondsPerMinute *
    options.era.minutesPerHour;

  const endTime =
    startTime +
    (
      GLOBAL_OCCURRENCE_HORIZON_HOURS *
      secondsPerHour
    );

  const occurrences: Occurrence[] = [
    ...generateSimClockOccurrences(
      startTime,
      endTime,
      options.markers,
      options.era
    ),

    // Celestial global Occurrences will
    // eventually be included here.

    // Almanac global Occurrences will
    // eventually be included here.
  ];

  globalOccurrenceTimeline.replace(
    occurrences
  );
}