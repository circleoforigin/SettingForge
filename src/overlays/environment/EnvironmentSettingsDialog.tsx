import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { environmentService } from '../../simulation/EnvironmentService';
import {
  createEnvironmentWeightVector,
  resolveEnvironmentWeight,
  type EnvironmentWeightCategory,
} from '../../simulation/EnvironmentWeightResolver';
import type {
  EnvironmentDefinitions,
  EnvironmentNamedDefinition,
  EnvironmentSeasonWeightVectors,
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
  category: EnvironmentWeightCategory,
  entries: WeightedEntry[],
  seasonId: string | undefined,
  rulesetVectors:
    EnvironmentDefinitions['generation'],
  worldVectors: EnvironmentSeasonWeightVectors[],
  onWeightChange: (
    seasonId: string,
    category: EnvironmentWeightCategory,
    targetId: string,
    desiredWeight: number,
    inheritedWeight: number
  ) => void,
  onRevert: () => void
)
{
  return (
    <EnvironmentSettingsSection<WeightedEntry>
      title={title}
      entries={entries}
      onChange={() => {}}
      onRevert={onRevert}
      renderEntry={entry =>
      {
        const inheritedWeight = seasonId
          ? resolveEnvironmentWeight(
              entry.generationWeight,
              seasonId,
              category,
              entry.id,
              rulesetVectors?.seasonalWeightVectors
            )
          : entry.generationWeight;

        const effectiveWeight = seasonId
          ? resolveEnvironmentWeight(
              entry.generationWeight,
              seasonId,
              category,
              entry.id,
              rulesetVectors?.seasonalWeightVectors,
              worldVectors
            )
          : inheritedWeight;

        return (
          <>
            <span className="environment-settings-static-value">
              {entry.name}
            </span>

            <label>Weight</label>

            <input
              type="number"
              min="0"
              aria-label={`${entry.name} weight`}
              value={effectiveWeight}
              disabled={!seasonId}
              onChange={event =>
              {
                if (!seasonId)
                {
                  return;
                }

                onWeightChange(
                  seasonId,
                  category,
                  entry.id,
                  Math.max(
                    0,
                    Number(event.target.value) || 0
                  ),
                  inheritedWeight
                );
              }}
            />
          </>
        );
      }}
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
  const formatInputRef =
  useRef<HTMLInputElement>(null);

const formatSelectionRef =
  useRef({
    start: 0,
    end: 0,
  });

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

const [worldVectors, setWorldVectors] =
  useState<EnvironmentSeasonWeightVectors[]>(
    () =>
      environmentService.getDefinitionOverrides()
        .seasonalWeightVectors ?? []
  );

const [selectedSeasonId, setSelectedSeasonId] =
  useState<string | undefined>(
    () => environmentService.getDefinitions()
      ?.seasons[0]?.id
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

const updateWorldWeight = (
  seasonId: string,
  category: EnvironmentWeightCategory,
  targetId: string,
  desiredWeight: number,
  inheritedWeight: number
) =>
{
  const vector = createEnvironmentWeightVector(
    targetId,
    desiredWeight,
    inheritedWeight
  );

  setWorldVectors(current =>
  {
    const seasons = structuredClone(current);

    let season = seasons.find(
      item => item.seasonId === seasonId
    );

    if (!season)
    {
      season = {
        seasonId,
        visibility: [],
        cloudCover: [],
        precipitation: [],
        windStrength: [],
        specialWeather: [],
      };

      seasons.push(season);
    }

    season[category] = season[category].filter(
      item => item.targetId !== targetId
    );

    if (vector)
    {
      season[category].push(vector);
    }

    return seasons.filter(item =>
      item.visibility.length > 0 ||
      item.cloudCover.length > 0 ||
      item.precipitation.length > 0 ||
      item.windStrength.length > 0 ||
      item.specialWeather.length > 0
    );
  });
};

const revertWorldCategory = (
  seasonId: string,
  category: EnvironmentWeightCategory
) =>
{
  setWorldVectors(current =>
    current
      .map(season => {
        if (season.seasonId !== seasonId)
        {
          return season;
        }

        return {
          ...season,
          [category]: [],
        };
      })
      .filter(season =>
        season.visibility.length > 0 ||
        season.cloudCover.length > 0 ||
        season.precipitation.length > 0 ||
        season.windStrength.length > 0 ||
        season.specialWeather.length > 0
      )
  );
};

const saveDefinitions = () =>
{
  if (!draft)
  {
    return;
  }

  environmentService.setDefinitionOverrides({
    ...environmentService.getDefinitionOverrides(),

    temperature: structuredClone(
      draft.temperature
    ),

    seasonalWeightVectors:
      structuredClone(worldVectors),
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
              title="Seasons - select one to edit seasonal weights"
              entries={draft.seasons}
              selectedId={selectedSeasonId}
              onSelect={setSelectedSeasonId}
              onChange={entries =>
                updateCategory('seasons', entries)
              }              
renderEntry={entry => (
  <>
    <span className="environment-settings-static-value">
      {entry.name}
    </span>

    <label>L:</label>

    <span className="environment-settings-static-number">
      {entry.lowTemperature}
    </span>

    <label>H:</label>

    <span className="environment-settings-static-number">
      {entry.highTemperature}
    </span>
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
  'visibility',
  draft.visibility,
  selectedSeasonId,
  draft.generation,
  worldVectors,
  updateWorldWeight,
  () =>
  {
    if (selectedSeasonId)
    {
        revertWorldCategory(selectedSeasonId, 'visibility');
    }
  }
)}

{renderWeightedSection(
  'Cloud Cover',
  'cloudCover',
  draft.cloudCover,
  selectedSeasonId,
  draft.generation,
  worldVectors,
  updateWorldWeight,
  () =>
  {
    if (selectedSeasonId)
    {
        revertWorldCategory(selectedSeasonId, 'cloudCover');
    }
  }
)}

{renderWeightedSection(
  'Precipitation',
  'precipitation',
  draft.precipitation,
  selectedSeasonId,
  draft.generation,
  worldVectors,
  updateWorldWeight,
  () =>
  {
    if (selectedSeasonId)
    {
        revertWorldCategory(selectedSeasonId, 'precipitation');
    }
  }
)}

            <EnvironmentSettingsSection
  title="Wind Strength"
  entries={draft.windStrength}
  onChange={() => {}}
  onRevert={() =>
  {
    if (selectedSeasonId)
    {
      revertWorldCategory(
        selectedSeasonId,
        'windStrength'
      );
    }
  }}
  renderEntry={entry =>
  {
    const inheritedWeight = selectedSeasonId
      ? resolveEnvironmentWeight(
          entry.generationWeight,
          selectedSeasonId,
          'windStrength',
          entry.id,
          draft.generation?.seasonalWeightVectors
        )
      : entry.generationWeight;

    const effectiveWeight = selectedSeasonId
      ? resolveEnvironmentWeight(
          entry.generationWeight,
          selectedSeasonId,
          'windStrength',
          entry.id,
          draft.generation?.seasonalWeightVectors,
          worldVectors
        )
      : inheritedWeight;

    return (
      <>
        <span className="environment-settings-static-value">
          {entry.name}
        </span>

        <label>L:</label>

        <span className="environment-settings-static-number">
          {entry.minimumSpeed}
        </span>

        <label>H:</label>

        <span className="environment-settings-static-number">
          {entry.maximumSpeed}
        </span>

        <label>Weight</label>

        <input
          type="number"
          min="0"
          aria-label={`${entry.name} wind strength weight`}
          value={effectiveWeight}
          disabled={!selectedSeasonId}
          onChange={event =>
          {
            if (!selectedSeasonId)
            {
              return;
            }

            updateWorldWeight(
              selectedSeasonId,
              'windStrength',
              entry.id,
              Math.max(
                0,
                Number(event.target.value) || 0
              ),
              inheritedWeight
            );
          }}
        />
      </>
    );
  }}
/>

{renderWeightedSection(
  'Special',
  'specialWeather',
  draft.specialWeather,
  selectedSeasonId,
  draft.generation,
  worldVectors,
  updateWorldWeight,
  () =>
  {
    if (selectedSeasonId)
    {
        revertWorldCategory(selectedSeasonId, 'specialWeather');
    }
  }
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