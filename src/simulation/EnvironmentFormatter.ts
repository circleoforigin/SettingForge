import type {
  EnvironmentSettings,
  EnvironmentState,
} from './EnvironmentSettings';
import type { EnvironmentDefinitions } from './EnvironmentDefinitions';

export const ENVIRONMENT_FORMAT_FIELDS = [
  { value: 'season', label: 'Season', token: '{season}' },
  { value: 'temperature', label: 'Temperature', token: '{temperature}' },
  { value: 'visibility', label: 'Visibility', token: '{visibility}' },
  { value: 'cloudCover', label: 'Cloud Cover', token: '{cloudCover}' },
  { value: 'precipitation', label: 'Precipitation', token: '{precipitation}' },
  { value: 'storm', label: 'Storm', token: '{storm}' },
  { value: 'windSpeed', label: 'Wind Speed', token: '{windSpeed}' },
  { value: 'windDirection', label: 'Wind Direction', token: '{windDirection}' },
] as const;

export type EnvironmentFormatField =
  typeof ENVIRONMENT_FORMAT_FIELDS[number]['value'];

export function formatEnvironment(
  format: string,
  state: EnvironmentState,
  settings: EnvironmentSettings,
  definitions?: EnvironmentDefinitions
): string
{
  const season =
    definitions?.seasons.find(
      item => item.id === state.seasonId
    )?.name ?? state.seasonId;

  const precipitation =
    definitions?.precipitation.find(
      item => item.id === state.precipitation.typeId
    )?.name ?? state.precipitation.typeId;

  const storm =
    definitions?.specialWeather.find(
      item => item.id === state.storm.typeId
    )?.name ?? state.storm.typeId;

const visibility =
  definitions?.visibility.find(
    item => item.id === state.visibility.typeId
  )?.name ??
  state.visibility.typeId;

const cloudCover =
  definitions?.cloudCover.find(
    item => item.id === state.cloudCoverTypeId
  )?.name ??
  state.cloudCoverTypeId;

  const windDirection =
    definitions?.windDirections.find(
      item => item.degrees === state.wind.direction
    )?.name ??
    String(state.wind.direction);

  const values: Record<EnvironmentFormatField, string> = {
    season,
    temperature: `${state.temperature}°`,
    visibility,
    cloudCover,
    precipitation,
    storm,
    windSpeed: String(state.wind.speed),
    windDirection,
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