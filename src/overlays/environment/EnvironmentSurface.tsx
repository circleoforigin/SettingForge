
import {
  useEffect,
  useState,
} from 'react';

import type {
  OverlaySurfaceProps,
} from '../OverlayDefinition';

import {
  environmentService,
} from '../../simulation/EnvironmentService';

import type {
  EnvironmentSettings,
  EnvironmentState,
} from '../../simulation/EnvironmentSettings';

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

  useEffect(() =>
  {
    return environmentService.subscribe(
      (state, nextSettings) =>
      {
        setEnvironment(state);
        setSettings(nextSettings);
      }
    );
  }, []);

  const selectedSeason =
    settings.seasons.find(
      (season) =>
        season.id === environment.seasonId
    );

  const setSeason = (seasonId: string) =>
  {
    environmentService.setState({
      ...environment,
      seasonId,
    });
  };

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
          {selectedSeason?.name ?? 'Environment'}
          {' · '}
          {environment.temperature}°
        </button>
      ) : (
        <div className="environment-expanded">
          <div className="environment-header">
            <strong>Environment</strong>

            <button
              type="button"
              onClick={() => setExpanded(false)}
            >
              Close
            </button>
          </div>

          <label>
            Season
            <select
              value={environment.seasonId}
              onChange={(event) =>
                setSeason(event.target.value)
              }
            >
              {settings.seasons.map((season) => (
                <option
                  key={season.id}
                  value={season.id}
                >
                  {season.name}
                </option>
              ))}
            </select>
          </label>

          <div>
            Temperature: {environment.temperature}°
          </div>

          <div>
            Visibility: {environment.visibility.distance}
          </div>

          <div>
            Cloud Cover: {environment.cloudCover}%
          </div>

          <div>
            Precipitation: {environment.precipitation.typeId}
            {' ('}
            {environment.precipitation.intensity}
            {')'}
          </div>

          <div>
            Storm: {environment.storm.typeId}
            {' ('}
            {environment.storm.severity}
            {')'}
          </div>

          <div>
            Wind: {environment.wind.speed}
            {' · '}
            {environment.wind.direction}°
          </div>
        </div>
      )}
    </div>
  );
}
