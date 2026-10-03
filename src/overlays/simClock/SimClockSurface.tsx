import { useState } from 'react';
import type { OverlaySurfaceProps } from '../OverlayDefinition';
import { OVERLAY_PLACEMENTS } from '../OverlayPlacement';

const CLOCK_FIELDS = [
  { key: 'year', label: 'Year', value: '1993' },
  { key: 'era', label: 'Era', value: 'CE' },
  { key: 'month', label: 'Month', value: 'October' },
  { key: 'day', label: 'Day', value: '6' },
  { key: 'hour', label: 'Hour', value: '10' },
  { key: 'minute', label: 'Min', value: '42' },
  { key: 'second', label: 'Second', value: '00' },
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
              className="sim-clock-field"
            >
              <span className="sim-clock-field-label">
                {field.label}
              </span>

              <div className="sim-clock-field-control">
                <input
                  type="text"
                  value={field.value}
                  readOnly
                />

                <div className="sim-clock-field-arrows">
                  <button
                    type="button"
                    aria-label={`Increase ${field.label}`}
                  >
                    ▲
                  </button>

                  <button
                    type="button"
                    aria-label={`Decrease ${field.label}`}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}