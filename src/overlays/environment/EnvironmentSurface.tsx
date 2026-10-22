import {
  useEffect,
  useState,
} from 'react';
import type { OverlaySurfaceProps } from '../OverlayDefinition';
import { formatEnvironment } from '../../simulation/EnvironmentFormatter';
import { environmentService } from '../../simulation/EnvironmentService';
import type {
  EnvironmentSettings,
  EnvironmentState,
} from '../../simulation/EnvironmentSettings';
import type { EnvironmentDefinitions } from '../../simulation/EnvironmentDefinitions';

function statesEqual(
  a: EnvironmentState | undefined,
  b: EnvironmentState | undefined
): boolean
{
  return JSON.stringify(a) === JSON.stringify(b);
}

export function EnvironmentSurface({
  mountId = 'bottom-right',
}: OverlaySurfaceProps)
{
  const [expanded, setExpanded] = useState(false);
  const [definitions, setDefinitions] =
    useState<EnvironmentDefinitions | undefined>(
      () => environmentService.getDefinitions()
    );

  const [settings, setSettings] =
    useState<EnvironmentSettings>(
      () => environmentService.getSettings()
    );

const [environment, setEnvironment] =
  useState<EnvironmentState | undefined>(
    () => environmentService.getState()
  );

const [draft, setDraft] =
  useState<EnvironmentState | undefined>(
    () => environmentService.getState()
  );

  const [dirty, setDirty] = useState(false);

useEffect(() =>
{
  return environmentService.subscribe(
    (state, nextSettings) =>
    {
      setEnvironment(state);
      setSettings(nextSettings);
      setDefinitions(environmentService.getDefinitions());
      setDraft(state);
      setDirty(false);
    }
  );
}, []);

const updateDraft = (
  updater: (current: EnvironmentState) =>
    EnvironmentState
) =>
{
  setDraft(current =>
    current ? updater(current) : current
  );

  if (draft)
  {
    setDirty(true);
  }
};

  const hasChanges =
    dirty && !statesEqual(draft, environment);

const commit = () =>
{
  if (!hasChanges || !draft)
  {
    return;
  }

  environmentService.setState(draft);
  setDirty(false);
};

const visibilityOptions =
  definitions?.visibility ?? [];

const visibilityValue =
  draft?.visibility.typeId ?? '';

const cloudOptions =
  definitions?.cloudCover ?? [];

const cloudValue =
  draft?.cloudCoverTypeId ?? '';

const windStrengths =
  definitions?.windStrength ?? [];

const windValue =
  draft
    ? windStrengths.findIndex(
        option =>
          draft.wind.speed >= option.minimumSpeed &&
          draft.wind.speed <= option.maximumSpeed
      )
    : -1;

const windDirections =
  definitions?.windDirections ?? [];

const directionValue =
  draft
    ? windDirections.findIndex(
        option =>
          option.degrees === draft.wind.direction
      )
    : -1;
    if (!environment || !draft)
{
  return (
    <div
      className="environment-surface"
      data-mount={mountId}
    >
      <div className="environment-summary">
        Environment unavailable
      </div>
    </div>
  );
}

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
  settings,
  definitions
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

      <div className="environment-controls-grid">
        <div className="environment-primary-controls">
          <div className="environment-control-row">
            <label>
              <select
                value={draft.seasonId}
                onChange={event =>
                  updateDraft(current => ({
                    ...current,
                    seasonId: event.target.value,
                  }))
                }
              >
                {definitions?.seasons.map(season => (
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
    updateDraft(current => ({
      ...current,
      visibility: {
        ...current.visibility,
        typeId: event.target.value,
      },
    }));
  }}
>

  {visibilityOptions.map(option => (
    <option
      key={option.id}
      value={option.id}
    >
      {option.name}
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
    updateDraft(current => ({
      ...current,
      cloudCoverTypeId: event.target.value,
    }));
  }}
>

  {cloudOptions.map(option => (
    <option
      key={option.id}
      value={option.id}
    >
      {option.name}
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
{definitions?.precipitation.map(type => (
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
      windStrengths[Number(event.target.value)];

    if (!option)
    {
      return;
    }

    updateDraft(current => ({
      ...current,
      wind: {
        ...current.wind,
        speed: option.minimumSpeed,
      },
    }));
  }}
>
  {windValue === -1 && (
    <option value={-1}>Custom</option>
  )}

  {windStrengths.map((option, index) => (
    <option key={option.id} value={index}>
      {option.name}
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
      windDirections[Number(event.target.value)];

    if (!option)
    {
      return;
    }

    updateDraft(current => ({
      ...current,
      wind: {
        ...current.wind,
        direction: option.degrees,
      },
    }));
  }}
>
  {directionValue === -1 && (
    <option value={-1}>Custom</option>
  )}

  {windDirections.map((option, index) => (
    <option key={option.id} value={index}>
      {option.name}
    </option>
  ))}
</select>

          </div>
                  </div>

        <div className="environment-special-weather">
          <strong>Special Weather</strong>

          <div className="environment-special-weather-list">
            {(definitions?.specialWeather ?? [])
              .map(type => (
                <label key={type.id}>
                  <input
                    type="checkbox"
                    checked={draft.storm.typeId === type.id}
                    onChange={event =>
                      updateDraft(current => ({
                        ...current,
                        storm: {
                          ...current.storm,
                          typeId: event.target.checked
                            ? type.id
                            : 'none',
                        },
                      }))
                    }
                  />
                  <span>{type.name}</span>
                </label>
              ))}
               </div>

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
        </div>        
      )}
    </div>
  );
}
