import { useState } from 'react';
import type { OverlayPlacement } from '../OverlayPlacement';
import { SimClockSurface } from './SimClockSurface';

export interface SimClockMonth
{
  id: string;
  name: string;
  days: number;
}

export interface SimClockLeapRule
{
  interval: number;
  monthId: string;
  afterDay: number;
  additionalDays: number;
}

export interface SimClockReckoning
{
  name: string;
  abbreviation: string;
  yearOffset: number;
}

export interface SimClockSettings
{
  minutesPerHour: number;
  hoursPerDay: number;
  dayNames: string[];
  months: SimClockMonth[];
  leapRule?: SimClockLeapRule;
  reckoning: SimClockReckoning;
  dateFormat: string;
  timeFormat: '12-hour' | '24-hour';
}

const DEFAULT_SETTINGS: SimClockSettings = {
  minutesPerHour: 60,
  hoursPerDay: 24,

  dayNames: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],

  months: [
    { id: 'january', name: 'January', days: 31 },
    { id: 'february', name: 'February', days: 28 },
    { id: 'march', name: 'March', days: 31 },
    { id: 'april', name: 'April', days: 30 },
    { id: 'may', name: 'May', days: 31 },
    { id: 'june', name: 'June', days: 30 },
    { id: 'july', name: 'July', days: 31 },
    { id: 'august', name: 'August', days: 31 },
    { id: 'september', name: 'September', days: 30 },
    { id: 'october', name: 'October', days: 31 },
    { id: 'november', name: 'November', days: 30 },
    { id: 'december', name: 'December', days: 31 },
  ],

  leapRule: {
    interval: 4,
    monthId: 'february',
    afterDay: 28,
    additionalDays: 1,
  },

  reckoning: {
    name: 'Common Era',
    abbreviation: 'CE',
    yearOffset: 0,
  },

  dateFormat: '{month} {dayOrdinal}, {year}',
  timeFormat: '12-hour',
};

export function useSimClockOverlay()
{
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SimClockSettings>(DEFAULT_SETTINGS);

  return {
    settingsOpen,
    setSettingsOpen,
    settings,
    setSettings,
  };
}

export type SimClockOverlayController =
  ReturnType<typeof useSimClockOverlay>;

interface SimClockOverlayProps
{
  controller: SimClockOverlayController;
  placement: OverlayPlacement;
}

export function SimClockOverlay({
  controller,
  placement,
}: SimClockOverlayProps)
{
  return (
  <>
    <SimClockSurface
      placement={placement}
    />

    {controller.settingsOpen && (
      <div className="dialog-backdrop">
        <div className="dialog sim-clock-settings-dialog">
          <h2>
            SimClock Settings
          </h2>

          <div className="sim-clock-settings-section">
            <h3>
              Calendar
            </h3>

            <div className="sim-clock-settings-columns">
            <div className="sim-clock-settings-column">
            <label>
              <span>
                Minutes per Hour
              </span>

              <input
                type="number"
                min="1"
                value={
                  controller.settings
                    .minutesPerHour
                }
                onChange={(event) => {
                  const minutesPerHour =
                    Math.max(
                      1,
                      Number(
                        event.target.value
                      )
                    );

                  controller.setSettings(
                    (current) => ({
                      ...current,
                      minutesPerHour,
                    })
                  );
                }}
              />
            </label>

            <label>
              <span>
                Hours per Day
              </span>

              <input
                type="number"
                min="1"
                value={
                  controller.settings
                    .hoursPerDay
                }
                onChange={(event) => {
                  const hoursPerDay =
                    Math.max(
                      1,
                      Number(
                        event.target.value
                      )
                    );

                  controller.setSettings(
                    (current) => ({
                      ...current,
                      hoursPerDay,
                    })
                  );
                }}
              />
            </label>

           <div className="sim-clock-settings-list">
  <strong>
    Day Names
  </strong>

  <div className="sim-clock-day-list">
    {controller.settings.dayNames.map(
      (dayName, index) => (
        <div
          key={index}
          className="sim-clock-settings-row"
        >
          <input
            type="text"
            value={dayName}
            onChange={(event) => {
              const name =
                event.target.value;

              controller.setSettings(
                (current) => ({
                  ...current,
                  dayNames:
                    current.dayNames.map(
                      (
                        currentName,
                        currentIndex
                      ) =>
                        currentIndex === index
                          ? name
                          : currentName
                    ),
                })
              );
            }}
          />

          <button
            type="button"
            disabled={
              controller.settings
                .dayNames.length <= 1
            }
            onClick={() =>
              controller.setSettings(
                (current) => ({
                  ...current,
                  dayNames:
                    current.dayNames.filter(
                      (_, currentIndex) =>
                        currentIndex !== index
                    ),
                })
              )
            }
          >
            ×
          </button>
        </div>
      )
    )}
  </div>

  <button
    type="button"
    onClick={() =>
      controller.setSettings(
        (current) => ({
          ...current,
          dayNames: [
            ...current.dayNames,
            `Day ${
              current.dayNames.length + 1
            }`,
          ],
        })
      )
    }
  >
    + Add Day
  </button>
</div>

  </div>

  <div className="sim-clock-settings-column">

<div className="sim-clock-settings-list">
  <strong>
    Months
  </strong>

  <div className="sim-clock-month-list">
    {controller.settings.months.map(
      (month, index) => (
        <div
          key={month.id}
          className="sim-clock-settings-row"
        >
          <input
            type="text"
            value={month.name}
            onChange={(event) => {
              const name =
                event.target.value;

              controller.setSettings(
                (current) => ({
                  ...current,
                  months:
                    current.months.map(
                      (currentMonth) =>
                        currentMonth.id ===
                        month.id
                          ? {
                              ...currentMonth,
                              name,
                            }
                          : currentMonth
                    ),
                })
              );
            }}
          />

          <input
            type="number"
            min="1"
            title="Days"
            value={month.days}
            onChange={(event) => {
              const days =
                Math.max(
                  1,
                  Number(
                    event.target.value
                  )
                );

              controller.setSettings(
                (current) => ({
                  ...current,
                  months:
                    current.months.map(
                      (currentMonth) =>
                        currentMonth.id ===
                        month.id
                          ? {
                              ...currentMonth,
                              days,
                            }
                          : currentMonth
                    ),
                })
              );
            }}
          />

          <button
            type="button"
            disabled={
              controller.settings
                .months.length <= 1
            }
            onClick={() =>
              controller.setSettings(
                (current) => ({
                  ...current,
                  months:
                    current.months.filter(
                      (currentMonth) =>
                        currentMonth.id !==
                        month.id
                    ),
                  leapRule:
                    current.leapRule
                      ?.monthId === month.id
                      ? undefined
                      : current.leapRule,
                })
              )
            }
          >
            ×
          </button>
        </div>
      )
    )}
  </div>

  <button
    type="button"
    onClick={() =>
      controller.setSettings(
        (current) => ({
          ...current,
          months: [
            ...current.months,
            {
              id:
                crypto.randomUUID(),
              name:
                `Month ${
                  current.months.length + 1
                }`,
              days: 30,
            },
          ],
        })
      )
    }
  >
    + Add Month
  </button>
</div>
 
<div className="sim-clock-settings-list">
  <label>
    <input
      type="checkbox"
      checked={
        controller.settings.leapRule !==
        undefined
      }
      onChange={(event) => {
        const enabled =
          event.target.checked;

        controller.setSettings(
          (current) => ({
            ...current,
            leapRule: enabled
              ? {
                  interval: 4,
                  monthId:
                    current.months[0].id,
                  afterDay:
                    current.months[0].days,
                  additionalDays: 1,
                }
              : undefined,
          })
        );
      }}
    />

    <strong>
      Leap Day
    </strong>
  </label>

  {controller.settings.leapRule && (
    <div className="sim-clock-leap-settings">
      <label>
        <span>
          Every
        </span>

        <input
          type="number"
          min="1"
          value={
            controller.settings
              .leapRule.interval
          }
          onChange={(event) => {
            const interval =
              Math.max(
                1,
                Number(
                  event.target.value
                )
              );

            controller.setSettings(
              (current) => ({
                ...current,
                leapRule:
                  current.leapRule
                    ? {
                        ...current.leapRule,
                        interval,
                      }
                    : undefined,
              })
            );
          }}
        />

        <span>
          years
        </span>
      </label>

      <label>
        <span>
          Month
        </span>

        <select
          value={
            controller.settings
              .leapRule.monthId
          }
          onChange={(event) => {
            const monthId =
              event.target.value;

            controller.setSettings(
              (current) => ({
                ...current,
                leapRule:
                  current.leapRule
                    ? {
                        ...current.leapRule,
                        monthId,
                      }
                    : undefined,
              })
            );
          }}
        >
          {controller.settings.months.map(
            (month) => (
              <option
                key={month.id}
                value={month.id}
              >
                {month.name}
              </option>
            )
          )}
        </select>
      </label>

      <label>
        <span>
          After Day
        </span>

        <input
          type="number"
          min="1"
          value={
            controller.settings
              .leapRule.afterDay
          }
          onChange={(event) => {
            const afterDay =
              Math.max(
                1,
                Number(
                  event.target.value
                )
              );

            controller.setSettings(
              (current) => ({
                ...current,
                leapRule:
                  current.leapRule
                    ? {
                        ...current.leapRule,
                        afterDay,
                      }
                    : undefined,
              })
            );
          }}
        />
      </label>

      <label>
        <span>
          Additional Days
        </span>

        <input
          type="number"
          min="1"
          value={
            controller.settings
              .leapRule.additionalDays
          }
          onChange={(event) => {
            const additionalDays =
              Math.max(
                1,
                Number(
                  event.target.value
                )
              );

            controller.setSettings(
              (current) => ({
                ...current,
                leapRule:
                  current.leapRule
                    ? {
                        ...current.leapRule,
                        additionalDays,
                      }
                    : undefined,
              })
            );
          }}
        />
      </label>
    </div>
  )}
</div>
  </div>
  </div>
          </div>

          <div className="dialog-buttons">
            <button
              type="button"
              onClick={() =>
                controller.setSettingsOpen(
                  false
                )
              }
            >
              Close
            </button>
          </div>
        </div>
        
      </div>
    )}
  </>
);
}