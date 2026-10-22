import {
  useEffect,
  useState,
} from 'react';

import { environmentService } from '../../simulation/EnvironmentService';

import type {
  EnvironmentDefinitions,
  EnvironmentNamedDefinition,
} from '../../simulation/EnvironmentDefinitions';

import {
  EnvironmentSettingsSection,
} from './EnvironmentSettingsSection';

type WeightedEntry =
  EnvironmentNamedDefinition & {
    generationWeight: number;
  };

function createEntry<T extends { id: string }>(
  template: Omit<T, 'id'>
): T
{
  return {
    ...template,
    id: crypto.randomUUID(),
  } as T;
}

function renderWeightedSection<T extends WeightedEntry>(
  title: string,
  entries: T[],
  onChange: (entries: T[]) => void,
  create: () => T,
  minimumEntries = 1
)
{
  return (
    <EnvironmentSettingsSection
      title={title}
      entries={entries}
      onChange={onChange}
      createEntry={create}
      minimumEntries={minimumEntries}
      renderEntry={(entry, update) => (
        <>
          <input
            type="text"
            aria-label={`${title} name`}
            value={entry.name}
            onChange={event =>
              update({
                name: event.target.value,
              } as Partial<T>)
            }
          />

          <label>Weight</label>

          <input
            type="number"
            min="0"
            aria-label={`${entry.name} weight`}
            value={entry.generationWeight}
            onChange={event =>
              update({
                generationWeight: Math.max(
                  0,
                  Number(event.target.value)
                ),
              } as Partial<T>)
            }
          />
        </>
      )}
    />
  );
}

interface EnvironmentSettingsDialogProps
{
  onClose: () => void;
}

export function EnvironmentSettingsDialog({
  onClose,
}: EnvironmentSettingsDialogProps)
{
  const [draft, setDraft] =
    useState<EnvironmentDefinitions | undefined>(
      () => environmentService.getDefinitions()
    );

  useEffect(() =>
  {
    return environmentService.subscribe(() =>
    {
      setDraft(
        environmentService.getDefinitions()
      );
    });
  }, []);

  const updateCategory = <
    K extends keyof EnvironmentDefinitions
  >(
    category: K,
    value: EnvironmentDefinitions[K]
  ) =>
  {
    setDraft(current =>
      current
        ? {
            ...current,
            [category]: value,
          }
        : current
    );
  };

  return (
    <div className="dialog-backdrop">
      <div className="dialog environment-settings-dialog">
        <h2>Environment Settings</h2>

        {!draft ? (
          <p>
            Assign a Ruleset to this World
            to configure its Environment.
          </p>
        ) : (
          <div className="environment-settings-content">
            <EnvironmentSettingsSection
              title="Seasons"
              entries={draft.seasons}
              onChange={entries =>
                updateCategory('seasons', entries)
              }
              createEntry={() =>
                createEntry({
                  name: 'New Season',
                  lowTemperature: 0,
                  highTemperature: 50,
                  generationWeight: 0,
                })
              }
              renderEntry={(entry, update) => (
                <>
                  <input
                    type="text"
                    aria-label="Season name"
                    value={entry.name}
                    onChange={event =>
                      update({
                        name: event.target.value,
                      })
                    }
                  />

                  <label>Low</label>

                  <input
                    type="number"
                    aria-label="Low temperature"
                    value={entry.lowTemperature}
                    onChange={event =>
                      update({
                        lowTemperature:
                          Number(event.target.value),
                      })
                    }
                  />

                  <label>High</label>

                  <input
                    type="number"
                    aria-label="High temperature"
                    value={entry.highTemperature}
                    onChange={event =>
                      update({
                        highTemperature:
                          Number(event.target.value),
                      })
                    }
                  />

                  <label>Weight</label>

                  <input
                    type="number"
                    min="0"
                    aria-label="Season weight"
                    value={entry.generationWeight ?? 0}
                    onChange={event =>
                      update({
                        generationWeight: Math.max(
                          0,
                          Number(event.target.value)
                        ),
                      })
                    }
                  />
                </>
              )}
            />

            <section className="environment-settings-section">
              <div className="environment-settings-section-header">
                <h3>Temperature</h3>
              </div>

              <div className="environment-settings-temperature">
                <label>
                  Unit
                  <select
                    value={draft.temperature.unit}
                    onChange={event =>
                      updateCategory('temperature', {
                        ...draft.temperature,
                        unit: event.target.value as
                          'fahrenheit' | 'celsius',
                      })
                    }
                  >
                    <option value="fahrenheit">
                      Fahrenheit
                    </option>
                    <option value="celsius">
                      Celsius
                    </option>
                  </select>
                </label>

                <label>
                  Rain/Snow Threshold
                  <input
                    type="number"
                    value={
                      draft.temperature.rainSnowThreshold
                    }
                    onChange={event =>
                      updateCategory('temperature', {
                        ...draft.temperature,
                        rainSnowThreshold:
                          Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
            </section>

            {renderWeightedSection(
              'Visibility',
              draft.visibility,
              entries =>
                updateCategory('visibility', entries),
              () =>
                createEntry({
                  name: 'New Visibility',
                  generationWeight: 0,
                })
            )}

            {renderWeightedSection(
              'Cloud Cover',
              draft.cloudCover,
              entries =>
                updateCategory('cloudCover', entries),
              () =>
                createEntry({
                  name: 'New Cloud Cover',
                  generationWeight: 0,
                })
            )}

            {renderWeightedSection(
              'Precipitation',
              draft.precipitation,
              entries =>
                updateCategory('precipitation', entries),
              () =>
                createEntry({
                  name: 'New Precipitation',
                  generationWeight: 0,
                })
            )}

            <EnvironmentSettingsSection
              title="Wind Strength"
              entries={draft.windStrength}
              onChange={entries =>
                updateCategory('windStrength', entries)
              }
              createEntry={() =>
                createEntry({
                  name: 'New Wind Strength',
                  minimumSpeed: 0,
                  maximumSpeed: 10,
                  generationWeight: 0,
                })
              }
              renderEntry={(entry, update) => (
                <>
                  <input
                    type="text"
                    aria-label="Wind strength name"
                    value={entry.name}
                    onChange={event =>
                      update({
                        name: event.target.value,
                      })
                    }
                  />

                  <label>Min</label>

                  <input
                    type="number"
                    aria-label="Minimum wind speed"
                    value={entry.minimumSpeed}
                    onChange={event =>
                      update({
                        minimumSpeed:
                          Number(event.target.value),
                      })
                    }
                  />

                  <label>Max</label>

                  <input
                    type="number"
                    aria-label="Maximum wind speed"
                    value={entry.maximumSpeed}
                    onChange={event =>
                      update({
                        maximumSpeed:
                          Number(event.target.value),
                      })
                    }
                  />

                  <label>Weight</label>

                  <input
                    type="number"
                    min="0"
                    aria-label="Wind strength weight"
                    value={entry.generationWeight}
                    onChange={event =>
                      update({
                        generationWeight: Math.max(
                          0,
                          Number(event.target.value)
                        ),
                      })
                    }
                  />
                </>
              )}
            />

            {renderWeightedSection(
              'Special Weather',
              draft.specialWeather,
              entries =>
                updateCategory('specialWeather', entries),
              () =>
                createEntry({
                  name: 'New Special Weather',
                  description: '',
                  generationWeight: 0,
                  requirements: [],
                  effects: [],
                }),
              0
            )}
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