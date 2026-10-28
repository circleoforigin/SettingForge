export interface CelestialSeasonStart
{
  seasonId: string;
  monthId: string;
  day: number;
}

export interface CelestialSettings
{
  seasonStarts: CelestialSeasonStart[];
}

export const DEFAULT_CELESTIAL_SETTINGS:
  CelestialSettings = {
    seasonStarts: [],
  };

export function createDefaultCelestialSettings():
  CelestialSettings
{
  return structuredClone(
    DEFAULT_CELESTIAL_SETTINGS
  );
}