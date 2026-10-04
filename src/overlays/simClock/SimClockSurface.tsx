import { useState } from 'react';
import type { OverlaySurfaceProps } from '../OverlayDefinition';
import { SimClockValueControl } from './SimClockValueControl';
import { OVERLAY_PLACEMENTS } from '../OverlayPlacement';
import type { SimClockOverlayController } from './SimClockOverlay';
import {
  formatSimulationDate,
  formatSimulationTime,
  simulationTimeToCalendar,
} from '../../simulation/SimCalendar';

interface SimClockSurfaceProps
  extends OverlaySurfaceProps
{
  controller?: SimClockOverlayController;
}

type SimClockStage = 'collapsed' | 'go-to' | 'progression';
type SimClockProgressUnit =
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years';

type SimClockMarker =
  | 'sunrise'
  | 'noon'
  | 'sunset'
  | 'midnight';

interface SimClockProgressPreset
{
  name: string;
  amount: number;
  unit: SimClockProgressUnit;
}

const DEFAULT_PROGRESS_PRESETS: SimClockProgressPreset[] = [
  {
    name: 'Custom',
    amount: 1,
    unit: 'minutes',
  },
  {
    name: 'Custom',
    amount: 1,
    unit: 'minutes',
  },
  {
    name: 'Custom',
    amount: 1,
    unit: 'minutes',
  },
  {
    name: 'Custom',
    amount: 1,
    unit: 'minutes',
  },
];

export function SimClockSurface({
  placement,
  controller,
}: SimClockSurfaceProps)
{
  const [stage, setStage] = useState<SimClockStage>('collapsed');
const [progressPresetIndex, setProgressPresetIndex] =
  useState(0);

const [progressPresets, setProgressPresets] =
  useState<SimClockProgressPreset[]>(
    () => structuredClone(DEFAULT_PROGRESS_PRESETS)
  );

const [marker, setMarker] =
  useState<SimClockMarker>('sunrise');

const progressPreset =
  progressPresets[progressPresetIndex];

const updateProgressPreset = (
  update: Partial<SimClockProgressPreset>
) =>
{
  setProgressPresets((current) =>
    current.map((preset, index) =>
      index === progressPresetIndex
        ? {
            ...preset,
            ...update,
          }
        : preset
    )
  );
};

const stepProgressPreset = (
  direction: 1 | -1
) =>
{
  setProgressPresetIndex((current) =>
    (
      current +
      direction +
      progressPresets.length
    ) % progressPresets.length
  );
};

  if (!controller)
    return null;

  const calendar =
    simulationTimeToCalendar(
      controller.pendingTime,
      controller.activeEra
    );

  const halfDay =
    controller.activeEra.hoursPerDay / 2;

  let displayHour =
    calendar.hour % halfDay;

  if (displayHour === 0)
    displayHour = halfDay;

  const period =
    calendar.hour < halfDay
      ? 'AM'
      : 'PM';

  const clockFields = [
    {
      key: 'year',
      label: 'Year',
      value: String(calendar.year),
      after: ' ',
    },
    {
      key: 'era',
      label: 'Era',
      value:
        controller.activeEra.abbreviation,
      after: '   ',
    },
    {
      key: 'month',
      label: 'Month',
      value: calendar.monthName,
      after: ' ',
    },
    {
      key: 'day',
      label: 'Day',
      value: String(calendar.day),
      after: '   ',
    },
    {
      key: 'hour',
      label: 'Hour',
      value: String(displayHour),
      after: ':',
    },
    {
      key: 'minute',
      label: 'Min',
      value: String(calendar.minute)
        .padStart(2, '0'),
      after: ':',
    },
    {
      key: 'second',
      label: 'Second',
      value: String(calendar.second)
        .padStart(2, '0'),
      after: ` ${period}`,
    },
  ] as const;

  const resolvedPlacement =
    OVERLAY_PLACEMENTS[placement.index];

  return (
    <div
      className="sim-clock-surface"
      data-edge={resolvedPlacement.edge}
      data-alignment={resolvedPlacement.alignment}
      data-stage={stage}
    >
    {stage === 'collapsed' && (
        <button
            type="button"
            className="sim-clock-summary"
            onClick={() =>
            {
                controller.setPendingTime(controller.committedTime);
                setStage('go-to');
            }}
        >
            {formatSimulationDate(controller.committedTime, controller.activeEra)}
            {' · '}
            {formatSimulationTime(controller.committedTime, controller.activeEra)}
        </button>
    )}

      {stage !== 'collapsed' && (
  <div className="sim-clock-go-to">
    <button
      type="button"
      className="sim-clock-stage-handle"
      onClick={() => setStage(stage === 'progression' ? 'go-to' : 'progression')}
    >
      {stage === 'progression' ? '▲' : '▼'}
    </button>

    {clockFields.map((field) => (
            <div
  key={field.key}
  className="sim-clock-field-group"
>
  <div
    className={`sim-clock-field sim-clock-field-${field.key}`}
  >
<SimClockValueControl
  label={field.label}
  value={field.value}
  onValueChange={
    field.key === 'year'
      ? (value) =>
      {
        const year = Number(value);

        if (Number.isFinite(year))
        {
          controller.setPendingYear(year);
        }
      }
      : undefined
  }
  onStep={
  field.key === 'era'
    ? undefined
    : (direction) =>
        controller.stepPendingTime(
          field.key,
          direction
        )
}
/>
  </div>

  {field.after && (
    <span className="sim-clock-field-separator">
      {field.after}
    </span>
  )}
</div>
))}
<button
  type="button"
  className="sim-clock-set-time"
  onClick={controller.commitPendingTime}
>
  Set Time
</button>

<button
  type="button"
  className="sim-clock-stage-handle"
  onClick={() => setStage(stage === 'progression' ? 'go-to' : 'progression')}
>
  {stage === 'progression' ? '▲' : '▼'}
</button>

<button
  type="button"
  className="sim-clock-weekday"
            onClick={() => setStage('collapsed')}
          >
            {calendar.weekDay}
          </button>
          {stage === 'progression' && (
  <div className="sim-clock-progression">
    <div className="sim-clock-progression-column">
      <div className="sim-clock-progress-header">
        <input
          type="text"
          className="sim-clock-progress-name"
          value={progressPreset.name}
          onChange={(event) =>
            updateProgressPreset({
              name: event.target.value,
            })
          }
        />

        <button
          type="button"
          className="sim-clock-progress-button"
        >
          Progress
        </button>

        <div className="sim-clock-progress-preset-arrows">
          <button
            type="button"
            onClick={() =>
              stepProgressPreset(1)
            }
          >
            ▲
          </button>

          <button
            type="button"
            onClick={() =>
              stepProgressPreset(-1)
            }
          >
            ▼
          </button>
        </div>
      </div>

      <div className="sim-clock-progress-value">
        <input
          type="number"
          min="1"
          max="999"
          value={progressPreset.amount}
          onChange={(event) =>
            updateProgressPreset({
              amount: Math.max(
                1,
                Math.min(
                  999,
                  Number(event.target.value)
                )
              ),
            })
          }
        />

        <select
          value={progressPreset.unit}
          onChange={(event) =>
            updateProgressPreset({
              unit:
                event.target.value as
                SimClockProgressUnit,
            })
          }
        >
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </select>
      </div>
    </div>

    <div className="sim-clock-progression-column">
      <button type="button">
        To Marker
      </button>

      <select
        value={marker}
        onChange={(event) =>
          setMarker(
            event.target.value as
              SimClockMarker
          )
        }
      >
        <option value="sunrise">Sunrise</option>
        <option value="noon">Noon</option>
        <option value="sunset">Sunset</option>
        <option value="midnight">Midnight</option>
      </select>
    </div>

    <div className="sim-clock-progression-column sim-clock-progression-actions">
      <button type="button">
        Travel
      </button>

      <button type="button">
        Real Time
      </button>
    </div>
  </div>
)}
        </div>
      )}
    </div>
  );
}