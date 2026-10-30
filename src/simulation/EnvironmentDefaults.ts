import type { EnvironmentDefinitions } from './EnvironmentDefinitions';

export const DEFAULT_ENVIRONMENT_DEFINITIONS:
  EnvironmentDefinitions = {
    seasons: [
      {
        id: 'winter',
        name: 'Winter',
        lowTemperature: 0,
        highTemperature: 40,
      },
      {
        id: 'spring',
        name: 'Spring',
        lowTemperature: 40,
        highTemperature: 60,
      },
      {
        id: 'summer',
        name: 'Summer',
        lowTemperature: 60,
        highTemperature: 85,
      },
      {
        id: 'autumn',
        name: 'Autumn',
        lowTemperature: 40,
        highTemperature: 60,
      },
    ],

    temperature: {
      unit: 'fahrenheit',
      rainSnowThreshold: 30,
    },

    visibility: [
      {
        id: 'clear',
        name: 'Clear',
        generationWeight: 90,
      },
      {
        id: 'haze',
        name: 'Haze',
        generationWeight: 10,
      },
    ],

    cloudCover: [
      {
        id: 'clear-skies',
        name: 'Clear Skies',
        generationWeight: 45,
      },
      {
        id: 'partly-cloudy',
        name: 'Partly Cloudy',
        generationWeight: 40,
      },
      {
        id: 'overcast',
        name: 'Overcast',
        generationWeight: 15,
      },
    ],
    precipitation: [
      {
        id: 'dry',
        name: 'Dry',
        generationWeight: 90,
      },
      {
        id: 'light',
        name: 'Light',
        generationWeight: 8,
      },
      {
        id: 'heavy',
        name: 'Heavy',
        generationWeight: 2,
      },
    ],
    windStrength: [
      {
        id: 'light',
        name: 'Light',
        minimumSpeed: 0,
        maximumSpeed: 10,
        generationWeight: 65,
      },
      {
        id: 'moderate',
        name: 'Moderate',
        minimumSpeed: 11,
        maximumSpeed: 20,
        generationWeight: 27,
      },
      {
        id: 'strong',
        name: 'Strong',
        minimumSpeed: 21,
        maximumSpeed: 30,
        generationWeight: 7,
      },
      {
        id: 'severe',
        name: 'Severe',
        minimumSpeed: 31,
        maximumSpeed: 50,
        generationWeight: 1,
      },
    ],
    windDirections: [
      {
        id: 'n',
        name: 'N',
        degrees: 0,
      },
      {
        id: 'ne',
        name: 'NE',
        degrees: 45,
      },
      {
        id: 'e',
        name: 'E',
        degrees: 90,
      },
      {
        id: 'se',
        name: 'SE',
        degrees: 135,
      },
      {
        id: 's',
        name: 'S',
        degrees: 180,
      },
      {
        id: 'sw',
        name: 'SW',
        degrees: 225,
      },
      {
        id: 'w',
        name: 'W',
        degrees: 270,
      },
      {
        id: 'nw',
        name: 'NW',
        degrees: 315,
      },
    ],
    specialWeather: [],

    generation: {
      enabled: true,

      minimumUpdateMinutes: 180,
      maximumUpdateMinutes: 1440,

      seasonalWeightVectors: [
        {
          seasonId: 'winter',

          visibility: [
            { targetId: 'clear', delta: 2 },
            { targetId: 'haze', delta: -2 },
          ],

          cloudCover: [
            { targetId: 'clear', delta: -10 },
            { targetId: 'overcast', delta: 10 },
          ],

          precipitation: [
            { targetId: 'dry', delta: 2 },
            { targetId: 'light', delta: -1 },
            { targetId: 'heavy', delta: -1 },
          ],

          windStrength: [
            { targetId: 'light', delta: -5 },
            { targetId: 'moderate', delta: 3 },
            { targetId: 'strong', delta: 2 },
          ],

          specialWeather: [],
        },

        {
          seasonId: 'spring',

          visibility: [
            { targetId: 'clear', delta: -2 },
            { targetId: 'haze', delta: 2 },
          ],

          cloudCover: [
            { targetId: 'clear', delta: -5 },
            { targetId: 'overcast', delta: 5 },
          ],

          precipitation: [
            { targetId: 'dry', delta: -10 },
            { targetId: 'light', delta: 7 },
            { targetId: 'heavy', delta: 3 },
          ],

          windStrength: [
            { targetId: 'light', delta: -10 },
            { targetId: 'moderate', delta: 6 },
            { targetId: 'strong', delta: 3 },
            { targetId: 'severe', delta: 1 },
          ],

          specialWeather: [],
        },

        {
          seasonId: 'summer',

          visibility: [],

          cloudCover: [
            { targetId: 'clear', delta: 10 },
            { targetId: 'partly-cloudy', delta: -5 },
            { targetId: 'overcast', delta: -5 },
          ],

          precipitation: [
            { targetId: 'dry', delta: 2 },
            { targetId: 'light', delta: -1 },
            { targetId: 'heavy', delta: -1 },
          ],

          windStrength: [
            { targetId: 'light', delta: 5 },
            { targetId: 'moderate', delta: -3 },
            { targetId: 'strong', delta: -2 },
          ],

          specialWeather: [],
        },
      ],
    },
  };

  

export function createDefaultEnvironmentDefinitions():
  EnvironmentDefinitions
{
  return structuredClone(
    DEFAULT_ENVIRONMENT_DEFINITIONS
  );
}