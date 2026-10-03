import { useState } from 'react';
import type { OverlaySurfaceProps } from '../OverlayDefinition';
import { SimClockValueControl } from './SimClockValueControl';
import { OVERLAY_PLACEMENTS } from '../OverlayPlacement';

const CLOCK_FIELDS = [
  {
    key: 'year',
    label: 'Year',
    value: '1993',
    after: ' ',
  },
  {
    key: 'era',
    label: 'Era',
    value: 'CE',
    after: '   ',
  },
  {
    key: 'month',
    label: 'Month',
    value: 'October',
    after: ' ',
  },
  {
    key: 'day',
    label: 'Day',
    value: '6',
    after: '   ',
  },
  {
    key: 'hour',
    label: 'Hour',
    value: '10',
    after: ':',
  },
  {
    key: 'minute',
    label: 'Min',
    value: '42',
    after: ':',
  },
  {
    key: 'second',
    label: 'Second',
    value: '00',
    after: ' PM',
  },
] as const;

export function SimClockSurface({
  placement,
}: OverlaySurfaceProps)
{
  const [expanded, setExpanded] = useState(false);

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
          {CLOCK_FIELDS.map((field) => (
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
>
  Set Time
</button>
        </div>
      )}
    </div>
  );
}