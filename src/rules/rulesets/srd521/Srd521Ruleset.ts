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

interface AreaPropertiesInput
{
  values: {
    terrain?: string | null;
    difficultTerrain?: boolean | null;
  };
}

interface EncounterDistance
{
  dice: {
    count: number;
    sides: number;
  };
  multiplier: number;
  unit: 'feet';
}

interface AreaProperties
{
  maximumPace: 'slow' | 'medium' | 'fast' | 'special';
  encounterDistance: EncounterDistance;
  foragingDC: number;
  navigationDC: number;
  searchDC: number;
}

interface TerrainDefinition extends AreaProperties
{
  label: string;
}

export const SRD_521_RULESET_ID = 'srd-5.2.1';

const TERRAIN_DEFINITIONS:
  Record<string, TerrainDefinition> = {
    arctic: {
      label: 'Arctic',
      maximumPace: 'fast',
      encounterDistance: {
        dice: { count: 6, sides: 6 },
        multiplier: 10,
        unit: 'feet',
      },
      foragingDC: 20,
      navigationDC: 10,
      searchDC: 10,
    },

    coastal: {
      label: 'Coastal',
      maximumPace: 'medium',
      encounterDistance: {
        dice: { count: 2, sides: 10 },
        multiplier: 10,
        unit: 'feet',
      },
      foragingDC: 10,
      navigationDC: 5,
      searchDC: 15,
    },

    desert: {
      label: 'Desert',
      maximumPace: 'medium',
      encounterDistance: {
        dice: { count: 6, sides: 6 },
        multiplier: 10,
        unit: 'feet',
      },
      foragingDC: 20,
      navigationDC: 10,
      searchDC: 10,
    },

    forest: {
      label: 'Forest',
      maximumPace: 'medium',
      encounterDistance: {
        dice: { count: 2, sides: 8 },
        multiplier: 10,
        unit: 'feet',
      },
      foragingDC: 10,
      navigationDC: 15,
      searchDC: 15,
    },

    grassland: {
      label: 'Grassland',
      maximumPace: 'fast',
      encounterDistance: {
        dice: { count: 6, sides: 6 },
        multiplier: 10,
        unit: 'feet',
      },
      foragingDC: 15,
      navigationDC: 5,
      searchDC: 15,
    },

    hill: {
      label: 'Hill',
      maximumPace: 'medium',
      encounterDistance: {
        dice: { count: 2, sides: 10 },
        multiplier: 10,
        unit: 'feet',
      },
      foragingDC: 15,
      navigationDC: 10,
      searchDC: 15,
    },

    mountain: {
      label: 'Mountain',
      maximumPace: 'slow',
      encounterDistance: {
        dice: { count: 4, sides: 10 },
        multiplier: 10,
        unit: 'feet',
      },
      foragingDC: 20,
      navigationDC: 15,
      searchDC: 20,
    },

    swamp: {
      label: 'Swamp',
      maximumPace: 'slow',
      encounterDistance: {
        dice: { count: 2, sides: 8 },
        multiplier: 10,
        unit: 'feet',
      },
      foragingDC: 10,
      navigationDC: 15,
      searchDC: 20,
    },

    underdark: {
      label: 'Underdark',
      maximumPace: 'medium',
      encounterDistance: {
        dice: { count: 2, sides: 6 },
        multiplier: 10,
        unit: 'feet',
      },
      foragingDC: 20,
      navigationDC: 10,
      searchDC: 20,
    },

    urban: {
      label: 'Urban',
      maximumPace: 'medium',
      encounterDistance: {
        dice: { count: 2, sides: 6 },
        multiplier: 10,
        unit: 'feet',
      },
      foragingDC: 20,
      navigationDC: 15,
      searchDC: 15,
    },

    waterborne: {
      label: 'Waterborne',
      maximumPace: 'special',
      encounterDistance: {
        dice: { count: 6, sides: 6 },
        multiplier: 10,
        unit: 'feet',
      },
      foragingDC: 15,
      navigationDC: 10,
      searchDC: 15,
    },
  };

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

function deriveAreaProperties(
  input: AreaPropertiesInput
)
{
  const terrainId =
    typeof input.values.terrain === 'string'
      ? input.values.terrain
      : null;

  const terrain =
    terrainId
      ? TERRAIN_DEFINITIONS[terrainId]
      : undefined;

  if (!terrain)
  {
    return {
      values: {
        maximumPace: null,
        encounterDistance: null,
        foragingDC: null,
        navigationDC: null,
        searchDC: null,
      },

      data: {
        terrain: null,
        difficultTerrain:
          input.values.difficultTerrain === true,
        maximumPace: null,
        encounterDistance: null,
        foragingDC: null,
        navigationDC: null,
        searchDC: null,
      },
    };
  }

const maximumPaceLabel =
  terrain.maximumPace === 'slow'
    ? 'Slow'
    : terrain.maximumPace === 'fast'
      ? 'Fast'
      : terrain.maximumPace === 'special'
        ? 'Special'
        : 'Normal';

  const encounterDistance =
    terrain.encounterDistance;

  return {
    values: {
      maximumPace: maximumPaceLabel,
      encounterDistance:
        `${encounterDistance.dice.count}d${encounterDistance.dice.sides} × ${encounterDistance.multiplier} ft`,
      foragingDC: terrain.foragingDC,
      navigationDC: terrain.navigationDC,
      searchDC: terrain.searchDC,
    },

    data: {
      terrain: terrainId,
      difficultTerrain:
        input.values.difficultTerrain === true,
      maximumPace: terrain.maximumPace,
      encounterDistance,
      foragingDC: terrain.foragingDC,
      navigationDC: terrain.navigationDC,
      searchDC: terrain.searchDC,
    },
  };
}

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
            throw new Error(
              'TravelTime requires a valid distance.'
            );
          }

          return calculateTravelTime(input);
        },
      },
      {
        id: 'AreaProperties',

        handler: (context) =>
        {
          return deriveAreaProperties(
            context.input as AreaPropertiesInput
          );
        },
      },
    ],

      interactions: [
      {
        target: 'Regions.Section',
        schemaId: 'srd521.regions.section',
        fields: [
          {
            id: 'terrain',
            label: 'Terrain',
            type: 'select',
            defaultValue: 'grassland',
            required: true,
            options: Object.entries(
              TERRAIN_DEFINITIONS
            ).map(
              ([value, terrain]) => ({
                value,
                label: terrain.label,
              })
            ),
          },
          {
            id: 'difficultTerrain',
            label: 'Difficult Terrain',
            type: 'boolean',
            defaultValue: false,
            description:
              'Movement through Difficult Terrain costs 1 extra foot for every foot moved.',
          },
        ],

        derived: {
          functionId: 'AreaProperties',

          fields: [
            {
              id: 'maximumPace',
              label: 'Maximum Pace',
            },
            {
              id: 'encounterDistance',
              label: 'Encounter Distance',
            },
            {
              id: 'foragingDC',
              label: 'Foraging DC',
            },
            {
              id: 'navigationDC',
              label: 'Navigation DC',
            },
            {
              id: 'searchDC',
              label: 'Search DC',
            },
          ],
        },
      },
      {
        target: 'Regions.Piece',
        schemaId: 'srd521.regions.piece',
        fields: [
          {
            id: 'pace',
            label: 'Pace',
            type: 'select',
            required: true,
            defaultValue: 'medium',
            options: [
              {
                value: 'slow',
                label: 'Slow',
              },
              {
                value: 'medium',
                label: 'Medium',
              },
              {
                value: 'fast',
                label: 'Fast',
              },
            ],
          },
        ],
      },
    ],
};