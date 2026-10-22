export interface EnvironmentSettings
{
  displayFormat: string;
}

export interface EnvironmentState
{
  seasonId: string;

  temperature: number;

  visibility: {
    typeId: string;
  };

  cloudCoverTypeId: string;

  precipitation: {
    typeId: string;
  };

  specialWeatherTypeId: string;

  wind: {
    speed: number;
    direction: number;
  };
}