import { useState } from 'react';
import type { OverlaySurfaceProps } from '../OverlayDefinition';
import { SimClockValueControl } from './SimClockValueControl';
import { OVERLAY_PLACEMENTS } from '../OverlayPlacement';
import type { SimClockOverlayController } from './SimClockOverlay';
import type {
  SimClockMarker,
  SimClockProgressUnit,
} from '../../simulation/SimClockSettings';
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

export function SimClockSurface({
  placement,
  controller,
}: SimClockSurfaceProps)
{
  const [expanded, setExpanded] =
    useState(false);

  const [progressPresetIndex, setProgressPresetIndex] =
    useState(0);

  const [marker, setMarker] =
    useState<SimClockMarker>('sunrise');

  if (!controller)
    return null;

  const progressPreset =
    controller.settings.progressPresets[
      progressPresetIndex
    ];

  const stepProgressPreset = (
    direction: 1 | -1
  ) =>
  {
    setProgressPresetIndex((current) =>
      (
        current +
        direction +
        controller.settings.progressPresets.length
      ) %
      controller.settings.progressPresets.length
    );
  };

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
    >
      {!expanded && (
        <button
          type="button"
          className="sim-clock-summary"
          onClick={() =>
          {
            controller.setPendingTime(
              controller.committedTime
            );

            setExpanded(true);
          }}
        >
          {formatSimulationDate(
            controller.committedTime,
            controller.activeEra
          )}
          {' · '}
          {formatSimulationTime(
            controller.committedTime,
            controller.activeEra
          )}
        </button>
      )}

      {expanded && (
        <>
          <div className="sim-clock-progression">
            <div className="sim-clock-progression-column">
              <div className="sim-clock-progress-header">
                <input
                  type="text"
                  className="sim-clock-progress-name"
                  value={progressPreset.name}
                  onChange={(event) =>
                    controller.updateProgressPreset(
                      progressPresetIndex,
                      {
                        name: event.target.value,
                      }
                    )
                  }
                />

                <button
                  type="button"
                  className="sim-clock-progress-button"
                  onClick={() =>
                  {
                    controller.stopRealTime();

                    controller.progressTime(
                      progressPreset
                    );
                  }}
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
                    controller.updateProgressPreset(
                      progressPresetIndex,
                      {
                        amount: Math.max(
                          1,
                          Math.min(
                            999,
                            Number(
                              event.target.value
                            )
                          )
                        ),
                      }
                    )
                  }
                />

                <select
                  value={progressPreset.unit}
                  onChange={(event) =>
                    controller.updateProgressPreset(
                      progressPresetIndex,
                      {
                        unit:
                          event.target.value as
                            SimClockProgressUnit,
                      }
                    )
                  }
                >
                  <option value="seconds">
                    Seconds
                  </option>

                  <option value="minutes">
                    Minutes
                  </option>

                  <option value="hours">
                    Hours
                  </option>

                  <option value="days">
                    Days
                  </option>

                  <option value="weeks">
                    Weeks
                  </option>

                  <option value="months">
                    Months
                  </option>

                  <option value="years">
                    Years
                  </option>
                </select>
              </div>
            </div>

            <div className="sim-clock-progression-column">
              <button
                type="button"
                onClick={() =>
                {
                  controller.stopRealTime();

                  controller.progressToMarker(
                    marker
                  );
                }}
              >
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
                <option value="sunrise">
                  Sunrise
                </option>

                <option value="noon">
                  Noon
                </option>

                <option value="sunset">
                  Sunset
                </option>

                <option value="midnight">
                  Midnight
                </option>
              </select>
            </div>

            <div className="sim-clock-progression-column sim-clock-progression-actions">
              <button
                type="button"
                onClick={controller.requestTravel}
              >
                Travel
              </button>

              <button
                type="button"
                onClick={
                  controller.toggleRealTime
                }
              >
                {controller.realTimeActive
                  ? 'Stop'
                  : 'Real Time'}
              </button>
            </div>
          </div>

          <div className="sim-clock-go-to">
            {clockFields.map((field) => (
              <div
                key={field.key}
                className="sim-clock-field-group"
              >
                <div
                  className={
                    `sim-clock-field sim-clock-field-${field.key}`
                  }
                >
                  <SimClockValueControl
                    label={field.label}
                    value={field.value}
                    onValueChange={
                      field.key === 'year'
                        ? (value) =>
                        {
                          const year =
                            Number(value);

                          if (
                            Number.isFinite(
                              year
                            )
                          )
                          {
                            controller.setPendingYear(
                              year
                            );
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
              className={
                controller.pendingTime !==
                controller.committedTime
                  ? 'sim-clock-set-time sim-clock-set-time-pending'
                  : 'sim-clock-set-time'
              }
              onClick={() =>
              {
                controller.stopRealTime();
                controller.commitPendingTime();
              }}
              disabled={
                controller.pendingTime ===
                controller.committedTime
              }
            >
              Set Time
            </button>
          </div>

          <button
            type="button"
            className="sim-clock-weekday"
            onClick={() =>
              setExpanded(false)
            }
          >
            {calendar.weekDay}
          </button>
        </>
      )}
    </div>
  );
}