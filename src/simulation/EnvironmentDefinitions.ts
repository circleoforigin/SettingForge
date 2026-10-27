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

export interface EnvironmentWeightVector
{
  targetId: string;
  delta: number;
}

export interface EnvironmentSeasonWeightVectors
{
  seasonId: string;

  visibility: EnvironmentWeightVector[];
  cloudCover: EnvironmentWeightVector[];
  precipitation: EnvironmentWeightVector[];
  windStrength: EnvironmentWeightVector[];
  specialWeather: EnvironmentWeightVector[];
}

export interface EnvironmentWeatherGeneration
{
  enabled: boolean;

  minimumUpdateMinutes: number;
  maximumUpdateMinutes: number;

  seasonalWeightVectors?: EnvironmentSeasonWeightVectors[];
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

  generation?: EnvironmentWeatherGeneration;
}

export interface EnvironmentDefinitionOverrides
{
  seasons?: Partial<EnvironmentSeasonDefinition>[];
  temperature?: Partial<EnvironmentTemperatureDefinition>;
  seasonalWeightVectors?: EnvironmentSeasonWeightVectors[];
  visibility?: Partial<EnvironmentVisibilityDefinition>[];
  cloudCover?: Partial<EnvironmentCloudCoverDefinition>[];
  precipitation?: Partial<EnvironmentPrecipitationDefinition>[];
  windStrength?: Partial<EnvironmentWindStrengthDefinition>[];
  windDirections?: Partial<EnvironmentWindDirectionDefinition>[];
  specialWeather?: Partial<EnvironmentSpecialWeatherDefinition>[];

  generation?: Partial<EnvironmentWeatherGeneration>;
  replacements?: Partial<Pick<
  EnvironmentDefinitions,
  | 'seasons'
  | 'visibility'
  | 'cloudCover'
  | 'precipitation'
  | 'windStrength'
  | 'windDirections'
  | 'specialWeather'
>>;
}