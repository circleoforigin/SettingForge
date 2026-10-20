import type {
  EnvironmentSettings,
  EnvironmentState,
} from './EnvironmentSettings';

export const ENVIRONMENT_FORMAT_FIELDS = [
  { value: 'season', label: 'Season', token: '{season}' },
  { value: 'temperature', label: 'Temperature', token: '{temperature}' },
  { value: 'visibility', label: 'Visibility', token: '{visibility}' },
  { value: 'fogIntensity', label: 'Fog Intensity', token: '{fogIntensity}' },
  { value: 'cloudCover', label: 'Cloud Cover', token: '{cloudCover}' },
  { value: 'precipitation', label: 'Precipitation', token: '{precipitation}' },
  { value: 'precipitationIntensity', label: 'Precipitation Intensity', token: '{precipitationIntensity}' },
  { value: 'storm', label: 'Storm', token: '{storm}' },
  { value: 'stormSeverity', label: 'Storm Severity', token: '{stormSeverity}' },
  { value: 'windSpeed', label: 'Wind Speed', token: '{windSpeed}' },
  { value: 'windDirection', label: 'Wind Direction', token: '{windDirection}' },
] as const;

export type EnvironmentFormatField =
  typeof ENVIRONMENT_FORMAT_FIELDS[number]['value'];

export function formatEnvironment(
  format: string,
  state: EnvironmentState,
  settings: EnvironmentSettings
): string
{
  const season =
    settings.seasons.find(
      item => item.id === state.seasonId
    )?.name ?? state.seasonId;

  const precipitation =
    settings.precipitationTypes.find(
      item => item.id === state.precipitation.typeId
    )?.name ?? state.precipitation.typeId;

  const storm =
    settings.stormTypes.find(
      item => item.id === state.storm.typeId
    )?.name ?? state.storm.typeId;

  const values: Record<EnvironmentFormatField, string> = {
    season,
    temperature: String(state.temperature),
    visibility: String(state.visibility.distance),
    fogIntensity: String(state.visibility.fogIntensity),
    cloudCover: String(state.cloudCover),
    precipitation,
    precipitationIntensity: String(state.precipitation.intensity),
    storm,
    stormSeverity: String(state.storm.severity),
    windSpeed: String(state.wind.speed),
    windDirection: String(state.wind.direction),
  };

  return ENVIRONMENT_FORMAT_FIELDS.reduce(
    (result, field) =>
      result.replaceAll(
        field.token,
        values[field.value]
      ),
    format
  );
}
