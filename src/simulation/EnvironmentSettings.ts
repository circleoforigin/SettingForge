
export interface EnvironmentSeason
{
  id: string;
  name: string;

  lowTemperature: number;
  highTemperature: number;
}

export interface EnvironmentConditionType
{
  id: string;
  name: string;
}

export interface EnvironmentSettings
{
  seasons: EnvironmentSeason[];

  precipitationTypes: EnvironmentConditionType[];
  stormTypes: EnvironmentConditionType[];

  displayFormat: string;
}

export interface EnvironmentState
{
  seasonId: string;

  temperature: number;

  visibility: {
    distance: number;
    fogIntensity: number;
  };

  cloudCover: number;

  precipitation: {
    typeId: string;
    intensity: number;
  };

  storm: {
    typeId: string;
    severity: number;
  };

  wind: {
    speed: number;
    direction: number;
  };
}

export const DEFAULT_ENVIRONMENT_SETTINGS:
  EnvironmentSettings = {
  displayFormat:
    '{season} · {temperature}° · {precipitation}',
  seasons: [
    {
      id: 'winter',
      name: 'Winter',
      lowTemperature: 25,
      highTemperature: 45,
    },
    {
      id: 'spring',
      name: 'Spring',
      lowTemperature: 45,
      highTemperature: 65,
    },
    {
      id: 'summer',
      name: 'Summer',
      lowTemperature: 70,
      highTemperature: 90,
    },
    {
      id: 'autumn',
      name: 'Autumn',
      lowTemperature: 50,
      highTemperature: 75,
    },
  ],

  precipitationTypes: [
    { id: 'none', name: 'None' },
    { id: 'rain', name: 'Rain' },
    { id: 'snow', name: 'Snow' },
    { id: 'sleet', name: 'Sleet' },
    { id: 'hail', name: 'Hail' },
  ],

  stormTypes: [
    { id: 'none', name: 'None' },
    { id: 'thunderstorm', name: 'Thunderstorm' },
    { id: 'blizzard', name: 'Blizzard' },
    { id: 'tornado', name: 'Tornado' },
    { id: 'hurricane', name: 'Hurricane' },
  ],
};

export const DEFAULT_ENVIRONMENT_STATE:
  EnvironmentState = {
  seasonId: 'spring',

  temperature: 55,

  visibility: {
    distance: 10,
    fogIntensity: 0,
  },

  cloudCover: 0,

  precipitation: {
    typeId: 'none',
    intensity: 0,
  },

  storm: {
    typeId: 'none',
    severity: 0,
  },

  wind: {
    speed: 0,
    direction: 0,
  },
};

export function createDefaultEnvironmentSettings():
  EnvironmentSettings
{
  return structuredClone(
    DEFAULT_ENVIRONMENT_SETTINGS
  );
}

export function createDefaultEnvironmentState():
  EnvironmentState
{
  return structuredClone(
    DEFAULT_ENVIRONMENT_STATE
  );
}
