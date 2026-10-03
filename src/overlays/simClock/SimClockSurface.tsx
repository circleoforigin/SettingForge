import { useState } from 'react';
import type { OverlaySurfaceProps } from '../OverlayDefinition';
import { SimClockValueControl } from './SimClockValueControl';
import { OVERLAY_PLACEMENTS } from '../OverlayPlacement';
import type { SimClockOverlayController } from './SimClockOverlay';
import { simulationTimeToCalendar } from '../../simulation/SimCalendar';

interface SimClockSurfaceProps
  extends OverlaySurfaceProps
{
  controller: SimClockOverlayController;
}

export function SimClockSurface({
  placement,
  controller,
}: SimClockSurfaceProps)
{
    const [expanded, setExpanded] = useState(false);

  const calendar =
    simulationTimeToCalendar(
      controller.pendingTime,
      controller.activeEra
    );

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
      value: String(calendar.hour)
        .padStart(2, '0'),
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
      after: '',
    },
  ] as const;

  const resolvedPlacement =
    OVERLAY_PLACEMENTS[placement.index];

  return (
    <div
      className="sim-clock-surface"
      data-edge={resolvedPlacement.edge}
      data-alignment={resolvedPlacement.alignment}
      data-expanded={expanded}
    >
      <button
        type="button"
        className="sim-clock-summary"
        onClick={() =>
          setExpanded((current) => !current)
        }
      >
        Wednesday, October 6th, 1993 CE · 10:42 PM
      </button>

      {expanded && (
        <div className="sim-clock-go-to">
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
            onClick={
                controller.commitPendingTime
            }
        >
            Set Time
        </button>
        </div>
      )}
    </div>
  );
}