import type { RulesetDefinition } from '../../RulesetDefinition';

interface TravelRulesetData
{
  values: Record<
    string,
    string | number | boolean | null | string[] | number[]
  >;
}

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
  entityIds: string[];

  area: {
    rulesetData: TravelRulesetData | null;
  } | null;

  path: {
    type: string;
    rulesetData: TravelRulesetData | null;
  } | null;
}

interface MovementFact
{
  speed: number;
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

type TravelPace =
  | 'slow'
  | 'medium'
  | 'fast';

const TRAVEL_PACES: TravelPace[] = [
  'slow',
  'medium',
  'fast',
];

function getMaximumPace(
  input: TravelTimeInput
): TravelPace | null
{
  const terrainId =
    input.area?.rulesetData?.values.terrain;

  if (typeof terrainId !== 'string')
  {
    return null;
  }

  const terrain =
    TERRAIN_DEFINITIONS[terrainId];

  if (
    !terrain ||
    terrain.maximumPace === 'special'
  )
  {
    return null;
  }

  let maximumPace =
    terrain.maximumPace;

  const goodRoad =
    input.path?.rulesetData?.values.goodRoad === true;

  if (goodRoad)
  {
    const index =
      TRAVEL_PACES.indexOf(
        maximumPace
      );

    maximumPace =
      TRAVEL_PACES[
        Math.min(
          index + 1,
          TRAVEL_PACES.length - 1
        )
      ];
  }

  return maximumPace;
}

function getEffectivePace(
  input: TravelTimeInput
): TravelPace
{
  const maximumPace =
    getMaximumPace(input);

  if (!maximumPace)
  {
    return input.pace;
  }

  const selectedIndex =
    TRAVEL_PACES.indexOf(
      input.pace
    );

  const maximumIndex =
    TRAVEL_PACES.indexOf(
      maximumPace
    );

  return TRAVEL_PACES[
    Math.min(
      selectedIndex,
      maximumIndex
    )
  ];
}

function calculateTravelTime(
  input: TravelTimeInput,
  movementSpeed: number
): TravelTimeOutput
{
  const normalSpeedMph = movementSpeed / 10;

  const effectivePace = getEffectivePace(input);

  const paceMultiplier =
    effectivePace === 'slow'
        ? 2 / 3
      : effectivePace === 'fast'
        ? 4 / 3
        : 1;

  const speedMph = normalSpeedMph * paceMultiplier;

  const difficultTerrain =
    input.area
        ?.rulesetData
        ?.values
        .difficultTerrain === true;

  const vetoDifficultTerrain =
    input.path
        ?.rulesetData
        ?.values
        .overrideDifficultTerrain === true;

  const distanceMultiplier =
    difficultTerrain &&
    !vetoDifficultTerrain
        ? 2
        : 1;

  const distanceMiles =
    distanceToMiles(
        input.distance.value,
        input.distance.unit
    ) * distanceMultiplier;

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
    functions: [
{
  id: 'TravelTime',

  handler: async (context) =>
  {
    const input =
      context.input as TravelTimeInput;

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

    if (
      !Array.isArray(input.entityIds) ||
      input.entityIds.length === 0
    )
    {
      throw new Error(
        'TravelTime requires at least one entity.'
      );
    }

    const movementFacts =
      await context.requestEntityFacts<MovementFact>(
        input.entityIds,
        'movement'
      );

    const movementSpeeds =
      movementFacts
        .map(
          (fact) =>
            fact.value.speed
        )
        .filter(
          (speed) =>
            Number.isFinite(speed) &&
            speed > 0
        );

    if (
      movementSpeeds.length !==
      input.entityIds.length
    )
    {
      throw new Error(
        'TravelTime could not resolve movement for every entity.'
      );
    }

    const movementSpeed =
      Math.min(...movementSpeeds);

    return calculateTravelTime(
      input,
      movementSpeed
    );
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
  target: 'Regions.PathSegment',
  schemaId: 'srd521.regions.pathSegment',

  fields: [
    {
      id: 'goodRoad',
      label: 'Good Road',
      type: 'boolean',
      defaultValue: false,
      description:
        'Increases the maximum travel pace by one step, to a maximum of Fast.',
    },
    {
      id: 'overrideDifficultTerrain',
      label: 'Veto Diff. Terrain',
      type: 'boolean',
      defaultValue: false,
      description:
        'Ignores Difficult Terrain imposed by the Area while traveling along this Path.',
    },
  ],
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