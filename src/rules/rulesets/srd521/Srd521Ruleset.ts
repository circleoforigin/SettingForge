import type { RulesetDefinition } from '../../RulesetDefinition';
import {
  OccurrenceProgressionModes,
  OccurrenceReactions,
} from '../../../overlays/occurrence/OccurrenceProgression';

interface TravelTimeInput
{
  distance: {
    value: number;
    unit:
      | 'feet'
      | 'miles'
      | 'meters'
      | 'kilometers';
  };
  pace:
    | 'slow'
    | 'medium'
    | 'fast';
  movementSpeed?: number;
}

interface TravelTimeOutput
{
  duration: number;
  speedMph: number;
}

export const SRD_521_RULESET_ID = 'srd-5.2.1';

function distanceToMiles(
  value: number,
  unit: TravelTimeInput['distance']['unit']
): number
{
  switch (unit)
  {
    case 'feet':
      return value / 5280;

    case 'miles':
      return value;

    case 'meters':
      return value / 1609.344;

    case 'kilometers':
      return value / 1.609344;
  }
}

function calculateTravelTime(
  input: TravelTimeInput
): TravelTimeOutput
{
  const movementSpeed =
    input.movementSpeed ?? 30;

  const normalSpeedMph =
    movementSpeed / 10;

  const paceMultiplier =
    input.pace === 'slow'
      ? 2 / 3
      : input.pace === 'fast'
        ? 4 / 3
        : 1;

  const speedMph =
    normalSpeedMph * paceMultiplier;

  const distanceMiles =
    distanceToMiles(
      input.distance.value,
      input.distance.unit
    );

  const duration =
    Math.max(
      0,
      Math.round(
        (distanceMiles / speedMph) *
        60 *
        60
      )
    );

  return {
    duration,
    speedMph,
  };
}

export const SRD_521_RULESET_VERSION = '0.1.0';

export const srd521Ruleset:
  RulesetDefinition = {
    id: SRD_521_RULESET_ID,
    name: 'SRD 5.2.1',
    version: SRD_521_RULESET_VERSION,
    description: 'SettingForge rules implementation based on SRD 5.2.1.',
    requirements: [],
    occurrenceTags: [
      {
        id: 'Movement',
        label: 'Movement',
        description:
          'The occurrence may affect movement or travel.',
        reactions: {
          [OccurrenceProgressionModes.RealTime]:
            OccurrenceReactions.Notify,
          [OccurrenceProgressionModes.Progress]:
            OccurrenceReactions.Notify,
          [OccurrenceProgressionModes.ToMarker]:
            OccurrenceReactions.Notify,
          [OccurrenceProgressionModes.Travel]:
            OccurrenceReactions.Recalculate,
        },
      },
      {
        id: 'VehicleMovement',
        label: 'Vehicle Movement',
        description:
          'The occurrence may affect movement while traveling by vehicle.',
        reactions: {
          [OccurrenceProgressionModes.RealTime]:
            OccurrenceReactions.Notify,
          [OccurrenceProgressionModes.Progress]:
            OccurrenceReactions.Notify,
          [OccurrenceProgressionModes.ToMarker]:
            OccurrenceReactions.Notify,
          [OccurrenceProgressionModes.Travel]:
            OccurrenceReactions.Recalculate,
        },
      },
      {
        id: 'Visibility',
        label: 'Visibility',
        description:
          'The occurrence may affect visibility.',
        reactions: {
          [OccurrenceProgressionModes.RealTime]:
            OccurrenceReactions.Recalculate,
          [OccurrenceProgressionModes.Progress]:
            OccurrenceReactions.Recalculate,
          [OccurrenceProgressionModes.ToMarker]:
            OccurrenceReactions.Recalculate,
          [OccurrenceProgressionModes.Travel]:
            OccurrenceReactions.Recalculate,
        },
      },
      {
        id: 'Encounter',
        label: 'Encounter',
        description:
          'The occurrence represents an encounter.',
        reactions: {
          [OccurrenceProgressionModes.RealTime]:
            OccurrenceReactions.Interrupt,
          [OccurrenceProgressionModes.Progress]:
            OccurrenceReactions.Interrupt,
          [OccurrenceProgressionModes.ToMarker]:
            OccurrenceReactions.Interrupt,
          [OccurrenceProgressionModes.Travel]:
            OccurrenceReactions.Interrupt,
        },
      },
    ],

    functions: [
  {
    id: 'TravelTime',

    handler: (context) =>
    {
      const input = context.input as TravelTimeInput;

      if (
        !input?.distance ||
        !Number.isFinite(
          input.distance.value
        ) ||
        input.distance.value < 0
      )
      {
        throw new Error('TravelTime requires a valid distance.');
      }

      return calculateTravelTime(input);
    },
  },
],

    interactions: [
    {
        target: 'Regions.Section',
        schemaId: 'srd521.regions.section',
        fields: [
            {
            id: 'difficultTerrain',
            label: 'Difficult Terrain',
            type: 'boolean',
            defaultValue: false,
            description: 'Movement through Difficult Terrain costs 1 extra foot for every foot moved.',
        },
      ],
    },
  ],
};