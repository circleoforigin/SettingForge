
import {
  useEffect,
  useState,
} from 'react';

import type {
  OverlaySurfaceProps,
} from '../OverlayDefinition';

import {
  formatEnvironment,
} from '../../simulation/EnvironmentFormatter';

import {
  environmentService,
} from '../../simulation/EnvironmentService';

import type {
  EnvironmentSettings,
  EnvironmentState,
} from '../../simulation/EnvironmentSettings';

const VISIBILITY_OPTIONS = [
  { label: 'Clear', distance: 10, fogIntensity: 0 },
  { label: 'Light Fog', distance: 5, fogIntensity: 25 },
  { label: 'Moderate Fog', distance: 2, fogIntensity: 50 },
  { label: 'Dense Fog', distance: 0.5, fogIntensity: 75 },
];

const CLOUD_OPTIONS = [
  { label: 'Clear', value: 0 },
  { label: 'Partly Cloudy', value: 25 },
  { label: 'Mostly Cloudy', value: 75 },
  { label: 'Overcast', value: 100 },
];

const WIND_OPTIONS = [
  { label: 'Calm', speed: 0 },
  { label: 'Light', speed: 5 },
  { label: 'Moderate', speed: 15 },
  { label: 'Strong', speed: 30 },
  { label: 'Severe', speed: 50 },
];

const WIND_DIRECTIONS = [
  { label: 'N', value: 0 },
  { label: 'NE', value: 45 },
  { label: 'E', value: 90 },
  { label: 'SE', value: 135 },
  { label: 'S', value: 180 },
  { label: 'SW', value: 225 },
  { label: 'W', value: 270 },
  { label: 'NW', value: 315 },
];

function statesEqual(
  a: EnvironmentState,
  b: EnvironmentState
): boolean
{
  return JSON.stringify(a) === JSON.stringify(b);
}

export function EnvironmentSurface({
  mountId = 'bottom-right',
}: OverlaySurfaceProps)
{
  const [expanded, setExpanded] =
    useState(false);

  const [settings, setSettings] =
    useState<EnvironmentSettings>(
      () => environmentService.getSettings()
    );

  const [environment, setEnvironment] =
    useState<EnvironmentState>(
      () => environmentService.getState()
    );

  const [draft, setDraft] =
    useState<EnvironmentState>(
      () => environmentService.getState()
    );

  const [dirty, setDirty] =
    useState(false);

useEffect(() =>
{
  return environmentService.subscribe(
    (state, nextSettings) =>
    {
      setEnvironment(state);
      setSettings(nextSettings);

      setDraft(current =>
        statesEqual(current, environmentService.getState())
          ? state
          : current
      );
    }
  );
}, []);

  const updateDraft = (
    updater: (current: EnvironmentState) =>
      EnvironmentState
  ) =>
  {
    setDraft(updater);
    setDirty(true);
  };

  const hasChanges =
    dirty && !statesEqual(draft, environment);

  const commit = () =>
  {
    if (!hasChanges)
    {
      return;
    }

    environmentService.setState(draft);
    setDirty(false);
  };

  const visibilityValue =
    VISIBILITY_OPTIONS.findIndex(
      option =>
        option.distance === draft.visibility.distance &&
        option.fogIntensity === draft.visibility.fogIntensity
    );

  const cloudValue =
    CLOUD_OPTIONS.findIndex(
      option => option.value === draft.cloudCover
    );

  const windValue =
    WIND_OPTIONS.findIndex(
      option => option.speed === draft.wind.speed
    );

  const directionValue =
    WIND_DIRECTIONS.findIndex(
      option => option.value === draft.wind.direction
    );

  return (
    <div
      className="environment-surface"
      data-mount={mountId}
    >
      {!expanded ? (
        <button
          type="button"
          className="environment-summary"
          onClick={() => setExpanded(true)}
        >
          {formatEnvironment(
            settings.displayFormat ??
              '{season} · {temperature}°',
            environment,
            settings
          )}
        </button>
) : (
    <div className="environment-expanded">
        <button
            type="button"
            className="environment-context-tab"
            onClick={() => setExpanded(false)}
            title="Retract Environment"
          >
            World Name
          </button>
          <div className="environment-control-row">
            <label>
              <span>Season:</span>
              <select
                value={draft.seasonId}
                onChange={event =>
                  updateDraft(current => ({
                    ...current,
                    seasonId: event.target.value,
                  }))
                }
              >
                {settings.seasons.map(season => (
                  <option
                    key={season.id}
                    value={season.id}
                  >
                    {season.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Temp:</span>
              <input
                type="number"
                value={draft.temperature}
                onChange={event =>
                  updateDraft(current => ({
                    ...current,
                    temperature: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>

          <div className="environment-control-row">
            <label>
              <span>Visibility:</span>
              <select
                value={visibilityValue}
                onChange={event =>
                {
                  const option =
                    VISIBILITY_OPTIONS[Number(event.target.value)];

                  if (!option) return;

                  updateDraft(current => ({
                    ...current,
                    visibility: {
                      distance: option.distance,
                      fogIntensity: option.fogIntensity,
                    },
                  }));
                }}
              >
                {visibilityValue === -1 && (
                  <option value={-1}>Custom</option>
                )}
                {VISIBILITY_OPTIONS.map((option, index) => (
                  <option key={index} value={index}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Cloud Cover:</span>
              <select
                value={cloudValue}
                onChange={event =>
                {
                  const option =
                    CLOUD_OPTIONS[Number(event.target.value)];

                  if (!option) return;

                  updateDraft(current => ({
                    ...current,
                    cloudCover: option.value,
                  }));
                }}
              >
                {cloudValue === -1 && (
                  <option value={-1}>Custom</option>
                )}
                {CLOUD_OPTIONS.map((option, index) => (
                  <option key={index} value={index}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="environment-control-row">
            <label>
              <span>Precipitation:</span>
              <select
                value={draft.precipitation.typeId}
                onChange={event =>
                  updateDraft(current => ({
                    ...current,
                    precipitation: {
                      ...current.precipitation,
                      typeId: event.target.value,
                    },
                  }))
                }
              >
                {settings.precipitationTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Storm:</span>
              <select
                value={draft.storm.typeId}
                onChange={event =>
                  updateDraft(current => ({
                    ...current,
                    storm: {
                      ...current.storm,
                      typeId: event.target.value,
                    },
                  }))
                }
              >
                {settings.stormTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="environment-wind-row">
            <label>
              <span>Wind:</span>
              <select
                value={windValue}
                onChange={event =>
                {
                  const option =
                    WIND_OPTIONS[Number(event.target.value)];

                  if (!option) return;

                  updateDraft(current => ({
                    ...current,
                    wind: {
                      ...current.wind,
                      speed: option.speed,
                    },
                  }));
                }}
              >
                {windValue === -1 && (
                  <option value={-1}>Custom</option>
                )}
                {WIND_OPTIONS.map((option, index) => (
                  <option key={index} value={index}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <select
              aria-label="Wind Direction"
              value={directionValue}
              onChange={event =>
              {
                const option =
                  WIND_DIRECTIONS[Number(event.target.value)];

                if (!option) return;

                updateDraft(current => ({
                  ...current,
                  wind: {
                    ...current.wind,
                    direction: option.value,
                  },
                }));
              }}
            >
              {directionValue === -1 && (
                <option value={-1}>Custom</option>
              )}
              {WIND_DIRECTIONS.map((option, index) => (
                <option key={index} value={index}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="environment-commit"
              disabled={!hasChanges}
              onClick={commit}
            >
              Commit
            </button>
          </div>          
        </div>        
      )}
    </div>
  );
}
