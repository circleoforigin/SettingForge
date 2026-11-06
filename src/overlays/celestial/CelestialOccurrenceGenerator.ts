import {
  OccurrenceReactions,
  type Occurrence,
} from '@settingforge/module-sdk';

import type {
  SimClockEra,
} from './SimClockSettings';

import {
  celestialService,
} from './CelestialService';

import {
  celestialMarkerRegistry,
} from './CelestialMarkers';

export function generateCelestialOccurrences(
  startTime: number,
  endTime: number,
  era: SimClockEra
): Occurrence[]
{
  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime
  )
  {
    return [];
  }

  const occurrences: Occurrence[] = [];

  const markers =
    celestialMarkerRegistry.getMarkers();

  for (const marker of markers)
  {
    let afterTime = startTime;

    while (true)
    {
      const targetTime =
        celestialService.resolveMarker(
          marker.id,
          afterTime,
          era
        );

      if (
        targetTime === undefined ||
        !Number.isFinite(targetTime) ||
        targetTime <= afterTime ||
        targetTime > endTime
      )
      {
        break;
      }

      occurrences.push({
        id: crypto.randomUUID(),
        sourceModuleId: 'overlay:celestial',
        simulationTime: targetTime,
        pieceId: null,
        entityId: null,
        sectorId: null,
        type: 'almanac',
        title: marker.name,
        description:
          `${marker.name} occurs.`,
        reaction:
          OccurrenceReactions.Notify,
      });

      if (marker.lifetime === 'temporary')
      {
        break;
      }

      afterTime = targetTime;
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