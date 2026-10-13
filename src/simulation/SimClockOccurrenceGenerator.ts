import {
  OccurrenceReactions,
  type Occurrence,
} from '@settingforge/module-sdk';
import {
  advanceSimulationTimeToMarker,
} from './SimCalendar';
import type {
  SimClockEra,
  SimClockMarker,
  SimClockMarkers,
} from './SimClockSettings';
import {
  formatSimClockOccurrenceMessage,
} from './SimClockOccurrenceMessages';

const MARKERS: readonly SimClockMarker[] = [
  'sunrise',
  'noon',
  'sunset',
  'midnight',
];

export function getSimClockOccurrenceKey(
  occurrence: Occurrence
): string | undefined
{
  if (
    occurrence.sourceModuleId !==
      'settingforge' ||
    occurrence.pieceId !== null ||
    occurrence.type !== 'almanac'
  )
  {
    return undefined;
  }

  return [
    occurrence.simulationTime,
    occurrence.title ?? '',
  ].join(':');
}

export function generateSimClockOccurrences(
  startTime: number,
  endTime: number,
  markers: SimClockMarkers,
  era: SimClockEra
): Occurrence[]
{
  if (endTime <= startTime)
  {
    return [];
  }

  const occurrences: Occurrence[] = [];

  for (const marker of MARKERS)
  {
    let simulationTime =
      advanceSimulationTimeToMarker(
        startTime,
        marker,
        markers,
        era
      );

    while (simulationTime <= endTime)
    {
      occurrences.push({
        id: crypto.randomUUID(),
        sourceModuleId: 'settingforge',
        simulationTime,
        pieceId: null,
        entityId: null,
        sectorId: null,
        type: 'almanac',
        title:
          marker === 'sunrise'
            ? 'Sunrise'
            : marker === 'noon'
              ? 'Noon'
              : marker === 'sunset'
                ? 'Sunset'
                : 'Midnight',
        description:
          formatSimClockOccurrenceMessage(
            marker
          ),
        reaction:
          OccurrenceReactions.Notify,
      });

      simulationTime =
        advanceSimulationTimeToMarker(
          simulationTime,
          marker,
          markers,
          era
        );
    }
  }

  occurrences.sort(
    (left, right) =>
      left.simulationTime -
        right.simulationTime ||
      left.id.localeCompare(right.id)
  );

  return occurrences;
}