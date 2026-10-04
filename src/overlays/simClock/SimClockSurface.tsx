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

export function SimClockSurface({
  placement,
  controller,
}: SimClockSurfaceProps)
{
  const [stage, setStage] = useState<SimClockStage>('collapsed');

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
        </div>
      )}
    </div>
  );
}