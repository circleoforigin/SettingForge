import type { EnvironmentDefinitions } from './EnvironmentDefinitions';
import type { EnvironmentState } from './EnvironmentSettings';

export function createInitialEnvironmentState(
  definitions: EnvironmentDefinitions
): EnvironmentState
{
  const season = definitions.seasons[0];
  const visibility = definitions.visibility[0];
  const cloudCover = definitions.cloudCover[0];
  const precipitation = definitions.precipitation[0];
  const windStrength = definitions.windStrength[0];
  const windDirection = definitions.windDirections[0];

  if (
    !season ||
    !visibility ||
    !cloudCover ||
    !precipitation ||
    !windStrength ||
    !windDirection
  )
  {
    throw new Error(
      'Ruleset has incomplete Environment definitions.'
    );
  }

  return {
    seasonId: season.id,

    temperature:
      definitions.temperature.unit === 'celsius'
        ? 10
        : 50,

visibility: {
  typeId: visibility.id,
},

cloudCoverTypeId: cloudCover.id,

precipitation: {
  typeId: precipitation.id,
},

specialWeatherTypeId: 'none',

    wind: {
      speed: windStrength.minimumSpeed,
      direction: windDirection.degrees,
    },
  };
}