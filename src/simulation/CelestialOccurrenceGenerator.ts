import {
  OccurrenceReactions,
  type Occurrence,
} from '@settingforge/module-sdk';
import type { SimClockEra } from './SimClockSettings';
import { celestialService } from './CelestialService';
import { celestialMarkerRegistry } from './CelestialMarkers';
import {
  formatSimClockOccurrenceMessage,
  type SimClockOccurrenceMessageKey,
} from './SimClockOccurrenceMessages';
import {
  findCelestialNotableTransitions,
} from './CelestialNotableResolver';

const legacyMessageKeys:
  Record<string, SimClockOccurrenceMessageKey> =
{
  sunrise: 'sunrise',
  'solar-noon': 'noon',
  sunset: 'sunset',
  midnight: 'midnight',
};

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
      const simulationTime =
        celestialService.resolveMarker(
          marker.id,
          afterTime,
          era
        );

      if (
        simulationTime === undefined ||
        !Number.isFinite(simulationTime) ||
        simulationTime <= afterTime ||
        simulationTime > endTime
      )
      {
        break;
      }

      const messageKey =
        legacyMessageKeys[marker.id];

      occurrences.push({
        id: crypto.randomUUID(),
        sourceModuleId: 'overlay:celestial',
        simulationTime,
        pieceId: null,
        entityId: null,
        sectorId: null,
        type: 'almanac',
        title:
          messageKey === 'noon'
            ? 'Noon'
            : marker.name,
        description:
          messageKey
            ? formatSimClockOccurrenceMessage(
                messageKey
              )
            : `${marker.name} occurs.`,
        reaction:
          OccurrenceReactions.Notify,
      });

      if (marker.lifetime === 'temporary')
      {
        break;
      }

      afterTime = simulationTime;
    }
  }
  
  const settings =
    celestialService.getSettings();

  for (const notable of settings.notables)
  {
    const transitions =
      findCelestialNotableTransitions(
        notable,
        settings,
        startTime,
        endTime,
        era
      );

    for (const simulationTime of transitions)
    {
      occurrences.push({
        id: crypto.randomUUID(),
        sourceModuleId: 'overlay:celestial',
        simulationTime,
        pieceId: null,
        entityId: null,
        sectorId: null,
        type: 'almanac',
        title: notable.name,
        description: `${notable.name} begins.`,
        reaction: OccurrenceReactions.Notify,
      });
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