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
    distance: number;
    fogIntensity: number;
  };

  cloudCover: number;
  cloudCoverTypeId?: string;

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