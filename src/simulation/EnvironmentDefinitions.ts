export const ENVIRONMENT_DEFINITION_ID =
  'Environment';

export interface EnvironmentNamedDefinition
{
  id: string;
  name: string;
}

export interface EnvironmentSeasonDefinition
  extends EnvironmentNamedDefinition
{
  lowTemperature: number;
  highTemperature: number;
  generationWeight?: number;
}

export interface EnvironmentTemperatureDefinition
{
  unit: 'fahrenheit' | 'celsius';
  rainSnowThreshold: number;
}

export interface EnvironmentVisibilityDefinition
  extends EnvironmentNamedDefinition
{
  generationWeight: number;
}

export interface EnvironmentCloudCoverDefinition
  extends EnvironmentNamedDefinition
{
  generationWeight: number;
}

export interface EnvironmentPrecipitationDefinition
  extends EnvironmentNamedDefinition
{
  generationWeight: number;
}

export interface EnvironmentWindStrengthDefinition
  extends EnvironmentNamedDefinition
{
  minimumSpeed: number;
  maximumSpeed: number;
  generationWeight: number;
}

export interface EnvironmentWindDirectionDefinition
  extends EnvironmentNamedDefinition
{
  degrees: number;
}

export interface EnvironmentSpecialWeatherDefinition
  extends EnvironmentNamedDefinition
{
  description?: string;
  generationWeight: number;
  requirements: EnvironmentConditionRequirement[];
  effects: EnvironmentConditionEffect[];
}

export interface EnvironmentConditionRequirement
{
  conditionId: string;
  operator:
    | 'equals'
    | 'notEquals'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterThanOrEqual'
    | 'lessThanOrEqual';

  value: string | number | boolean;
}

export interface EnvironmentConditionEffect
{
  conditionId: string;
  value: string | number | boolean;
}

export interface EnvironmentDefinitions
{
  seasons: EnvironmentSeasonDefinition[];
  temperature: EnvironmentTemperatureDefinition;
  visibility: EnvironmentVisibilityDefinition[];
  cloudCover: EnvironmentCloudCoverDefinition[];
  precipitation: EnvironmentPrecipitationDefinition[];
  windStrength: EnvironmentWindStrengthDefinition[];
  windDirections: EnvironmentWindDirectionDefinition[];
  specialWeather: EnvironmentSpecialWeatherDefinition[];
}