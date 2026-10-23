import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { environmentService } from '../../simulation/EnvironmentService';

import type {
  EnvironmentDefinitions,
  EnvironmentNamedDefinition,
} from '../../simulation/EnvironmentDefinitions';
import {
  ENVIRONMENT_FORMAT_FIELDS,
  formatEnvironment,
} from '../../simulation/EnvironmentFormatter';
import { EnvironmentSettingsSection } from './EnvironmentSettingsSection';

type WeightedEntry =
  EnvironmentNamedDefinition & {
    generationWeight: number;
  };

function renderWeightedSection(
  title: string,
  entries: WeightedEntry[],
  onChange: (entries: WeightedEntry[]) => void,
  create: () => WeightedEntry,
  minimumEntries = 1
)
{
  return (
    <EnvironmentSettingsSection<WeightedEntry>
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
            {
              update({
                name: event.target.value,
              });
            }}
          />

          <label>Weight</label>

          <input
            type="number"
            min="0"
            aria-label={`${entry.name} weight`}
            value={entry.generationWeight}
            onChange={event =>
            {
              update({
                generationWeight: Math.max(
                  0,
                  Number(event.target.value)
                ),
              });
            }}
          />
        </>
      )}
    />
  );
}

function createEntry<T extends object>(
  template: T
): T & { id: string }
{
  return {
    ...template,
    id: crypto.randomUUID(),
  };
}



interface EnvironmentSettingsDialogProps
{
  onClose: () => void;
}

export function EnvironmentSettingsDialog({
  onClose,
}: EnvironmentSettingsDialogProps)
{
  const formatInputRef =
  useRef<HTMLInputElement>(null);

const formatSelectionRef =
  useRef({
    start: 0,
    end: 0,
  });

const precipitationInputRef =
  useRef<HTMLInputElement | null>(null);

const precipitationSelectionRef = useRef({
  start: 0,
  end: 0,
});

const [activePrecipitationId, setActivePrecipitationId] =
  useState<string | null>(null);

const rememberPrecipitationSelection = (
  input: HTMLInputElement,
  id: string
) =>
{
  precipitationInputRef.current = input;
  setActivePrecipitationId(id);

  precipitationSelectionRef.current = {
    start: input.selectionStart ?? 0,
    end: input.selectionEnd ?? 0,
  };
};

const rememberFormatSelection = () =>
{
  const input = formatInputRef.current;

  if (!input)
  {
    return;
  }

  formatSelectionRef.current = {
    start: input.selectionStart ?? 0,
    end: input.selectionEnd ?? 0,
  };
};

  const [draft, setDraft] =
    useState<EnvironmentDefinitions | undefined>(
      () => environmentService.getDefinitions()
    );

    const [displayFormat, setDisplayFormat] =
  useState(
    () => environmentService.getSettings().displayFormat
  );

const [formatField, setFormatField] =
  useState<string>('');

const [previewState, setPreviewState] =
  useState(() => environmentService.getState());

useEffect(() =>
{
  return environmentService.subscribe(() =>
  {
    setPreviewState(environmentService.getState());
  });
}, []);

const updateCategory = <
  K extends keyof EnvironmentDefinitions,
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

  const insertPrecipitationType = () =>
{
  if (!draft || !activePrecipitationId)
  {
    return;
  }

  const entry = draft.precipitation.find(
    item => item.id === activePrecipitationId
  );

  if (!entry)
  {
    return;
  }

  const token = '{type}';

  const { start, end } =
    precipitationSelectionRef.current;

  const nextName =
    entry.name.slice(0, start) +
    token +
    entry.name.slice(end);

  const nextPosition = start + token.length;

  updateCategory(
    'precipitation',
    draft.precipitation.map(item =>
      item.id === entry.id
        ? { ...item, name: nextName }
        : item
    )
  );

  precipitationSelectionRef.current = {
    start: nextPosition,
    end: nextPosition,
  };

  requestAnimationFrame(() =>
  {
    const input = precipitationInputRef.current;

    if (input)
    {
      input.focus();
      input.setSelectionRange(
        nextPosition,
        nextPosition
      );
    }
  });
};

  const saveDefinitions = () =>
{
  if (!draft)
  {
    return;
  }

  const existing =
    environmentService.getDefinitionOverrides();

  environmentService.setDefinitionOverrides({
    ...existing,

    temperature: structuredClone(
      draft.temperature
    ),

    replacements: {
      ...existing.replacements,

      seasons: structuredClone(draft.seasons),
      visibility: structuredClone(draft.visibility),
      cloudCover: structuredClone(draft.cloudCover),
      precipitation: structuredClone(draft.precipitation),
      windStrength: structuredClone(draft.windStrength),
      specialWeather: structuredClone(draft.specialWeather),
    },
  });

  onClose();
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

                  <label>L:</label>

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

                  <label>H:</label>

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

            <section className="environment-settings-temperature-section">
  <div className="environment-settings-temperature-heading">
    <h3>Temperature</h3>

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
<option value="fahrenheit">°F</option>
<option value="celsius">°C</option>
        </select>
      </label>

      <label>
        Rain/Snow Threshold
        <input
          type="number"
          value={draft.temperature.rainSnowThreshold}
          onChange={event =>
            updateCategory('temperature', {
              ...draft.temperature,
              rainSnowThreshold: Number(event.target.value),
            })
          }
        />
      </label>
    </div>
  </div>

  <div className="environment-settings-description-section">
    <div className="environment-settings-section-header">
      <h3>Descriptive Tag</h3>
    </div>

    <div className="environment-settings-description-controls">
      <input
        ref={formatInputRef}
        type="text"
        aria-label="Environment display format"
        placeholder="{season} · {temperature}"
        value={displayFormat}
        onChange={event =>
        {
          setDisplayFormat(event.target.value);
          rememberFormatSelection();
        }}
        onClick={rememberFormatSelection}
        onKeyUp={rememberFormatSelection}
        onSelect={rememberFormatSelection}
      />

      <select
        aria-label="Insert environment field"
        value={formatField}
onChange={event =>
{
  const field =
    ENVIRONMENT_FORMAT_FIELDS.find(
      item => item.value === event.target.value
    );

  if (field)
  {
    const { start, end } =
      formatSelectionRef.current;

    const nextFormat =
      displayFormat.slice(0, start) +
      field.token +
      displayFormat.slice(end);

    const nextPosition =
      start + field.token.length;

    setDisplayFormat(nextFormat);

    formatSelectionRef.current = {
      start: nextPosition,
      end: nextPosition,
    };

    requestAnimationFrame(() =>
    {
      const input = formatInputRef.current;

      if (input)
      {
        input.focus();

        input.setSelectionRange(
          nextPosition,
          nextPosition
        );
      }
    });
  }

  setFormatField('');
}}
      >
        <option value="">Insert field...</option>

        {ENVIRONMENT_FORMAT_FIELDS.map(field => (
          <option key={field.value} value={field.value}>
            {field.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() =>
        {
          environmentService.setSettings({
            ...environmentService.getSettings(),
            displayFormat,
          });
        }}
      >
        Apply
      </button>
    </div>

    <div className="environment-settings-description-preview">
      <span>
        {previewState
          ? formatEnvironment(
              displayFormat,
              previewState,
              environmentService.getSettings(),
              draft
            )
          : 'Environment unavailable'}
      </span>
    </div>
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

<EnvironmentSettingsSection
  title="Precipitation"
  entries={draft.precipitation}
  onChange={entries =>
    updateCategory('precipitation', entries)
  }
  createEntry={() =>
    createEntry({
      name: 'New Precipitation',
      generationWeight: 0,
    })
  }
  headerAction={
    <button
      type="button"
      disabled={!activePrecipitationId}
      onMouseDown={event =>
      {
        event.preventDefault();
      }}
      onClick={insertPrecipitationType}
    >
      {'{type}'}
    </button>
  }
  renderEntry={(entry, update) => (
    <>
      <input
        type="text"
        aria-label="Precipitation name"
        value={entry.name}
        onFocus={event =>
          rememberPrecipitationSelection(
            event.currentTarget,
            entry.id
          )
        }
        onClick={event =>
          rememberPrecipitationSelection(
            event.currentTarget,
            entry.id
          )
        }
        onKeyUp={event =>
          rememberPrecipitationSelection(
            event.currentTarget,
            entry.id
          )
        }
        onSelect={event =>
          rememberPrecipitationSelection(
            event.currentTarget,
            entry.id
          )
        }
        onChange={event =>
        {
          update({
            name: event.target.value,
          });

          rememberPrecipitationSelection(
            event.currentTarget,
            entry.id
          );
        }}
        onBlur={event =>
        {
          const nextFocus = event.relatedTarget;

          if (
            nextFocus instanceof HTMLElement &&
            nextFocus.closest(
              '.environment-settings-section-header'
            )
          )
          {
            return;
          }

          setActivePrecipitationId(null);
        }}
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
          })
        }
      />
    </>
  )}
/>

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

                  <label>L:</label>

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

                  <label>H:</label>

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
  {
    updateCategory(
      'specialWeather',
      entries.map(entry =>
      {
        const existing =
          draft.specialWeather.find(
            item => item.id === entry.id
          );

        return {
          ...existing,
          ...entry,
          requirements: existing?.requirements ?? [],
          effects: existing?.effects ?? [],
        };
      })
    );
  },
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

  <button
    type="button"
    onClick={saveDefinitions}
    disabled={!draft}
  >
    Save
  </button>
</div>
      </div>
    </div>
  );
}