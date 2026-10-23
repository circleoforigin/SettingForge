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
  { value: 'specialWeather', label: 'Special Weather', token: '{specialWeather}' },
  { value: 'wind', label: 'Wind', token: '{wind}' },
] as const;

export type EnvironmentFormatField =
  typeof ENVIRONMENT_FORMAT_FIELDS[number]['value'];

export function formatPrecipitationName(
  name: string,
  temperature: number,
  definitions?: EnvironmentDefinitions
): string
{
  const threshold =
    definitions?.temperature.rainSnowThreshold ?? 32;

  const type =
    temperature <= threshold
      ? 'Snow'
      : 'Rain';

  return name.replaceAll('{type}', type);
}

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

const precipitationDefinition =
  definitions?.precipitation.find(
    item => item.id === state.precipitation.typeId
  );

const precipitationName =
  precipitationDefinition?.name ??
  state.precipitation.typeId;

const precipitation =
  formatPrecipitationName(
    precipitationName,
    state.temperature,
    definitions
  );

const specialWeather =
  state.specialWeatherTypeId === 'none'
    ? 'None'
    : definitions?.specialWeather.find(
        item => item.id === state.specialWeatherTypeId
      )?.name ?? state.specialWeatherTypeId;

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

  const wind =
    state.wind.speed === 0
        ? 'Still'
        : `${state.wind.speed} mph ${windDirection}`;

  const values: Record<EnvironmentFormatField, string> = {
    season,
    temperature: `${state.temperature}°${
        definitions?.temperature.unit === 'celsius'
            ? 'C'
            : 'F'
    }`,
    visibility,
    cloudCover,
    precipitation,
    specialWeather,
    wind,
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