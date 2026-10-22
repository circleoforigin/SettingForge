import {
  useEffect,
  useState,
} from 'react';
import { environmentService } from '../../simulation/EnvironmentService';
import type { EnvironmentDefinitions } from '../../simulation/EnvironmentDefinitions';

interface EnvironmentSettingsDialogProps
{
  onClose: () => void;
}

export function EnvironmentSettingsDialog({
  onClose,
}: EnvironmentSettingsDialogProps)
{
  const [definitions, setDefinitions] =
    useState<EnvironmentDefinitions | undefined>(
      () => environmentService.getDefinitions()
    );

  useEffect(() =>
  {
    return environmentService.subscribe(() =>
    {
      setDefinitions(
        environmentService.getDefinitions()
      );
    });
  }, []);

  return (
    <div className="dialog-backdrop">
      <div className="dialog environment-settings-dialog">
        <h2>Environment Settings</h2>

        {!definitions ? (
          <p>
            Assign a Ruleset to this World
            to configure its Environment.
          </p>
        ) : (
          <div className="environment-settings-content">
            <section>
              <h3>Seasons</h3>
              {definitions.seasons.map(season => (
                <div key={season.id}>
                  {season.name}: {season.lowTemperature}°
                  {' to '}
                  {season.highTemperature}°
                </div>
              ))}
            </section>

            <section>
              <h3>Temperature</h3>
              <p>
                Unit: {definitions.temperature.unit}
              </p>
              <p>
                Rain/Snow Threshold:{' '}
                {definitions.temperature.rainSnowThreshold}°
              </p>
            </section>

            <section>
              <h3>Visibility</h3>
              {definitions.visibility.map(item => (
                <div key={item.id}>
                  {item.name} — Weight: {item.generationWeight}
                </div>
              ))}
            </section>

            <section>
              <h3>Cloud Cover</h3>
              {definitions.cloudCover.map(item => (
                <div key={item.id}>
                  {item.name} — Weight: {item.generationWeight}
                </div>
              ))}
            </section>

            <section>
              <h3>Precipitation</h3>
              {definitions.precipitation.map(item => (
                <div key={item.id}>
                  {item.name} — Weight: {item.generationWeight}
                </div>
              ))}
            </section>

            <section>
              <h3>Wind Strength</h3>
              {definitions.windStrength.map(item => (
                <div key={item.id}>
                  {item.name}: {item.minimumSpeed}
                  {'–'}
                  {item.maximumSpeed}
                  {' — Weight: '}
                  {item.generationWeight}
                </div>
              ))}
            </section>

            <section>
              <h3>Special Weather</h3>
              {definitions.specialWeather.length === 0 ? (
                <p>No special weather defined.</p>
              ) : (
                definitions.specialWeather.map(item => (
                  <div key={item.id}>
                    {item.name} — Weight: {item.generationWeight}
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        <div className="dialog-actions">
          <button
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}