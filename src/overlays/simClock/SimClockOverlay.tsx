import { useEffect, useRef, useState } from 'react';
import {
  simulationClockService,
  type SimulationTime,
} from '../../simulation/SimulationClockService';
import {
  createDefaultSimClockSettings,
  type SimClockEra,
  type SimClockSettings,
} from '../../simulation/SimClockSettings';
import type { OverlayPlacement } from '../OverlayPlacement';
import { SimClockSurface } from './SimClockSurface';

const DEFAULT_SETTINGS: SimClockSettings = {
  activeEraId: 'common-era',

  eras: [
    {
      id: 'common-era',
      name: 'Common Era',
      abbreviation: 'CE',

      secondsPerMinute: 60,
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
        {
          id: 'january',
          name: 'January',
          days: 31,
        },
        {
          id: 'february',
          name: 'February',
          days: 28,
        },
        {
          id: 'march',
          name: 'March',
          days: 31,
        },
        {
          id: 'april',
          name: 'April',
          days: 30,
        },
        {
          id: 'may',
          name: 'May',
          days: 31,
        },
        {
          id: 'june',
          name: 'June',
          days: 30,
        },
        {
          id: 'july',
          name: 'July',
          days: 31,
        },
        {
          id: 'august',
          name: 'August',
          days: 31,
        },
        {
          id: 'september',
          name: 'September',
          days: 30,
        },
        {
          id: 'october',
          name: 'October',
          days: 31,
        },
        {
          id: 'november',
          name: 'November',
          days: 30,
        },
        {
          id: 'december',
          name: 'December',
          days: 31,
        },
      ],

      leapRule: {
        interval: 4,
        monthId: 'february',
        afterDay: 28,
        additionalDays: 1,
      },

      startingWeekday: 'Monday',

      dateFormat:
        '{monthName} {day#}, {year} {era}',
    },
  ],
};

type DateFormatField =
  | 'monthName'
  | 'monthNumber'
  | 'weekDay'
  | 'dayNumber'
  | 'era'
  | 'year';

const DATE_FORMAT_FIELDS: {
  value: DateFormatField;
  label: string;
  token: string;
}[] = [
  {
    value: 'monthName',
    label: 'MonthName',
    token: '{monthName}',
  },
  {
    value: 'monthNumber',
    label: 'Month#',
    token: '{month#}',
  },
  {
    value: 'weekDay',
    label: 'WeekDay',
    token: '{weekDay}',
  },
  {
    value: 'dayNumber',
    label: 'Day#',
    token: '{day#}',
  },
  {
    value: 'era',
    label: 'Era',
    token: '{era}',
  },
  {
    value: 'year',
    label: 'Year',
    token: '{year}',
  },
];

const DATE_FORMAT_PREVIEW:
  Record<DateFormatField, string> = {
    monthName: 'October',
    monthNumber: '10th',
    weekDay: 'Wednesday',
    dayNumber: '6th',
    era: 'CE',
    year: '1993',
  };

function formatDatePreview(
  format: string
): string
{
  return DATE_FORMAT_FIELDS.reduce(
    (result, field) =>
      result.replaceAll(
        field.token,
        DATE_FORMAT_PREVIEW[field.value]
      ),
    format
  );
}

export type SimClockOverlayController =
  ReturnType<typeof useSimClockOverlay>;

export function useSimClockOverlay()
{
    const [committedTime, setCommittedTime] =
    useState<SimulationTime>(
      simulationClockService.getTime()
    );

  const [pendingTime, setPendingTime] =
    useState<SimulationTime>(
      simulationClockService.getTime()
    );

  useEffect(() =>
  {
    return simulationClockService.subscribe(
      (time) =>
      {
        setCommittedTime(time);
        setPendingTime(time);
      }
    );
  }, []);

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [settings, setSettings] =
    useState<SimClockSettings>(
        createDefaultSimClockSettings
    );

  const activeEra =
    settings.eras.find(
      (era) =>
        era.id === settings.activeEraId
    ) ??
    settings.eras[0];

  const updateActiveEra = (
    update: (
      current: SimClockEra
    ) => SimClockEra
  ) =>
  {
    if (!activeEra)
      return;

    setSettings((current) => ({
      ...current,

      eras: current.eras.map((era) =>
        era.id === activeEra.id
          ? update(era)
          : era
      ),
    }));
  };

  const commitPendingTime = () =>
  {
    simulationClockService.setTime(
      pendingTime
    );
  };

  const restoreWorldState = (
  time: SimulationTime,
  settings: SimClockSettings
) =>
{
  setSettings(
    structuredClone(settings)
  );

  simulationClockService.setTime(
    time
  );

  setPendingTime(
    time
  );
};

    return {
    settingsOpen,
    setSettingsOpen,
    settings,
    setSettings,
    activeEra,
    updateActiveEra,
    committedTime,
    pendingTime,
    setPendingTime,
    commitPendingTime,
    restoreWorldState,
  };
}

interface SimClockOverlayProps
{
  controller: SimClockOverlayController;
  placement?: OverlayPlacement;
}

export function SimClockOverlay({
  controller,
  placement,
}: SimClockOverlayProps)
{
  const activeEra = controller.activeEra;

  const [dateFormatField, setDateFormatField] =
    useState<DateFormatField>(
      'monthName'
    );

  const dateFormatInputRef =
    useRef<HTMLInputElement>(null);

  if (!activeEra)
    return null;

  const addDateFormatField = () =>
  {
    const field = DATE_FORMAT_FIELDS.find(
      (candidate) =>
        candidate.value === dateFormatField
    );

    if (!field)
      return;

    const input =
      dateFormatInputRef.current;

    const currentFormat =
      activeEra.dateFormat;

    const start =
      input?.selectionStart ??
      currentFormat.length;

    const end =
      input?.selectionEnd ??
      start;

    const dateFormat =
      currentFormat.slice(0, start) +
      field.token +
      currentFormat.slice(end);

    controller.updateActiveEra(
      (current) => ({
        ...current,
        dateFormat,
      })
    );

    requestAnimationFrame(() => {
      const nextPosition =
        start + field.token.length;

      input?.focus();

      input?.setSelectionRange(
        nextPosition,
        nextPosition
      );
    });
  };

  return (
    <>
      {placement && (
        <SimClockSurface
            placement={placement}
            controller={controller}
        />
      )}

      {controller.settingsOpen && (
        <div className="dialog-backdrop">
          <div className="dialog sim-clock-settings-dialog">
            <h2>SimClock Settings</h2>

            <div className="sim-clock-settings-section">
              <h3>Calendar</h3>

              <div className="sim-clock-settings-columns">

                {/* CALENDAR / LEAP DAY */}

                <div className="sim-clock-settings-column">
                  <div className="sim-clock-basic-settings">
                    <label>
                      <span>
                        Seconds per Minute
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={
                          activeEra.secondsPerMinute
                        }
                        onChange={(event) => {
                          const secondsPerMinute =
                            Math.max(
                              1,
                              Number(
                                event.target.value
                              )
                            );

                          controller.updateActiveEra(
                            (current) => ({
                              ...current,
                              secondsPerMinute,
                            })
                          );
                        }}
                      />
                    </label>

                    <label>
                      <span>
                        Minutes per Hour
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={
                          activeEra.minutesPerHour
                        }
                        onChange={(event) => {
                          const minutesPerHour =
                            Math.max(
                              1,
                              Number(
                                event.target.value
                              )
                            );

                          controller.updateActiveEra(
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
                          activeEra.hoursPerDay
                        }
                        onChange={(event) => {
                          const hoursPerDay =
                            Math.max(
                              1,
                              Number(
                                event.target.value
                              )
                            );

                          controller.updateActiveEra(
                            (current) => ({
                              ...current,
                              hoursPerDay,
                            })
                          );
                        }}
                      />
                    </label>
                  </div>

                  <div className="sim-clock-leap-section">
                    <label className="sim-clock-leap-toggle">
                      <input
                        type="checkbox"
                        checked={
                          activeEra.leapRule !==
                          undefined
                        }
                        onChange={(event) => {
                          const enabled =
                            event.target.checked;

                          controller.updateActiveEra(
                            (current) => ({
                              ...current,

                              leapRule: enabled
                                ? {
                                    interval: 4,

                                    monthId:
                                      current
                                        .months[0]
                                        .id,

                                    afterDay:
                                      current
                                        .months[0]
                                        .days,

                                    additionalDays:
                                      1,
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

                    {activeEra.leapRule && (
                      <div className="sim-clock-leap-settings">
                        <label>
                          <span>Every</span>

                          <div className="sim-clock-inline-field">
                            <input
                              type="number"
                              min="1"
                              value={
                                activeEra
                                  .leapRule
                                  .interval
                              }
                              onChange={(
                                event
                              ) => {
                                const interval =
                                  Math.max(
                                    1,
                                    Number(
                                      event
                                        .target
                                        .value
                                    )
                                  );

                                controller.updateActiveEra(
                                  (
                                    current
                                  ) => ({
                                    ...current,

                                    leapRule:
                                      current
                                        .leapRule
                                        ? {
                                            ...current
                                              .leapRule,
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
                          </div>
                        </label>

                        <label>
                          <span>Month</span>

                          <select
                            value={
                              activeEra
                                .leapRule
                                .monthId
                            }
                            onChange={(
                              event
                            ) => {
                              const monthId =
                                event
                                  .target
                                  .value;

                              controller.updateActiveEra(
                                (
                                  current
                                ) => ({
                                  ...current,

                                  leapRule:
                                    current
                                      .leapRule
                                      ? {
                                          ...current
                                            .leapRule,
                                          monthId,
                                        }
                                      : undefined,
                                })
                              );
                            }}
                          >
                            {activeEra.months.map(
                              (month) => (
                                <option
                                  key={
                                    month.id
                                  }
                                  value={
                                    month.id
                                  }
                                >
                                  {
                                    month.name
                                  }
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
                              activeEra
                                .leapRule
                                .afterDay
                            }
                            onChange={(
                              event
                            ) => {
                              const afterDay =
                                Math.max(
                                  1,
                                  Number(
                                    event
                                      .target
                                      .value
                                  )
                                );

                              controller.updateActiveEra(
                                (
                                  current
                                ) => ({
                                  ...current,

                                  leapRule:
                                    current
                                      .leapRule
                                      ? {
                                          ...current
                                            .leapRule,
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
                              activeEra
                                .leapRule
                                .additionalDays
                            }
                            onChange={(
                              event
                            ) => {
                              const additionalDays =
                                Math.max(
                                  1,
                                  Number(
                                    event
                                      .target
                                      .value
                                  )
                                );

                              controller.updateActiveEra(
                                (
                                  current
                                ) => ({
                                  ...current,

                                  leapRule:
                                    current
                                      .leapRule
                                      ? {
                                          ...current
                                            .leapRule,
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

                {/* DAYS */}

                <div className="sim-clock-settings-column">
                  <div className="sim-clock-settings-list">
                    <div className="sim-clock-list-header">
                      <strong>Days</strong>

                      <button
                        type="button"
                        onClick={() =>
                          controller.updateActiveEra(
                            (current) => ({
                              ...current,

                              dayNames: [
                                ...current.dayNames,

                                `Day ${
                                  current
                                    .dayNames
                                    .length + 1
                                }`,
                              ],
                            })
                          )
                        }
                      >
                        + Add Day
                      </button>
                    </div>

                    <div className="sim-clock-day-list">
                      {activeEra.dayNames.map(
                        (
                          dayName,
                          index
                        ) => (
                          <div
                            key={index}
                            className="sim-clock-settings-row"
                          >
                            <input
                              type="text"
                              value={
                                dayName
                              }
                              onChange={(
                                event
                              ) => {
                                const name =
                                  event
                                    .target
                                    .value;

                                controller.updateActiveEra(
                                  (
                                    current
                                  ) => ({
                                    ...current,

                                    dayNames:
                                      current
                                        .dayNames
                                        .map(
                                          (
                                            currentName,
                                            currentIndex
                                          ) =>
                                            currentIndex ===
                                            index
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
                                activeEra
                                  .dayNames
                                  .length <= 1
                              }
                              onClick={() =>
                                controller.updateActiveEra(
                                  (
                                    current
                                  ) => {
                                    const dayNames =
                                      current
                                        .dayNames
                                        .filter(
                                          (
                                            _,
                                            currentIndex
                                          ) =>
                                            currentIndex !==
                                            index
                                        );

                                    const startingWeekday =
                                      dayNames.includes(
                                        current
                                          .startingWeekday
                                      )
                                        ? current
                                            .startingWeekday
                                        : dayNames[0];

                                    return {
                                      ...current,
                                      dayNames,
                                      startingWeekday,
                                    };
                                  }
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* MONTHS */}

                <div className="sim-clock-settings-column">
                  <div className="sim-clock-settings-list">
                    <div className="sim-clock-list-header">
                      <strong>
                        Months
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          controller.updateActiveEra(
                            (current) => ({
                              ...current,

                              months: [
                                ...current.months,

                                {
                                  id:
                                    crypto.randomUUID(),

                                  name:
                                    `Month ${
                                      current
                                        .months
                                        .length +
                                      1
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

                    <div className="sim-clock-month-list">
                      {activeEra.months.map(
                        (month) => (
                          <div
                            key={month.id}
                            className="sim-clock-settings-row"
                          >
                            <input
                              type="text"
                              value={
                                month.name
                              }
                              onChange={(
                                event
                              ) => {
                                const name =
                                  event
                                    .target
                                    .value;

                                controller.updateActiveEra(
                                  (
                                    current
                                  ) => ({
                                    ...current,

                                    months:
                                      current
                                        .months
                                        .map(
                                          (
                                            currentMonth
                                          ) =>
                                            currentMonth
                                              .id ===
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
                              value={
                                month.days
                              }
                              onChange={(
                                event
                              ) => {
                                const days =
                                  Math.max(
                                    1,
                                    Number(
                                      event
                                        .target
                                        .value
                                    )
                                  );

                                controller.updateActiveEra(
                                  (
                                    current
                                  ) => ({
                                    ...current,

                                    months:
                                      current
                                        .months
                                        .map(
                                          (
                                            currentMonth
                                          ) =>
                                            currentMonth
                                              .id ===
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
                                activeEra
                                  .months
                                  .length <= 1
                              }
                              onClick={() =>
                                controller.updateActiveEra(
                                  (
                                    current
                                  ) => ({
                                    ...current,

                                    months:
                                      current
                                        .months
                                        .filter(
                                          (
                                            currentMonth
                                          ) =>
                                            currentMonth
                                              .id !==
                                            month.id
                                        ),

                                    leapRule:
                                      current
                                        .leapRule
                                        ?.monthId ===
                                      month.id
                                        ? undefined
                                        : current
                                            .leapRule,
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
                  </div>
                </div>
              </div>
            </div>

            {/* ERA / DISPLAY */}

            <div className="sim-clock-settings-secondary">
              <div className="sim-clock-settings-column">
                <h3>Era</h3>

                <div className="sim-clock-reckoning-settings">
                  <label>
                    <span>Name</span>

                    <input
                      type="text"
                      value={
                        activeEra.name
                      }
                      onChange={(
                        event
                      ) => {
                        const name =
                          event.target.value;

                        controller.updateActiveEra(
                          (current) => ({
                            ...current,
                            name,
                          })
                        );
                      }}
                    />
                  </label>

                  <label>
                    <span>
                      Abbreviation
                    </span>

                    <input
                      type="text"
                      value={
                        activeEra.abbreviation
                      }
                      onChange={(
                        event
                      ) => {
                        const abbreviation =
                          event.target.value;

                        controller.updateActiveEra(
                          (current) => ({
                            ...current,
                            abbreviation,
                          })
                        );
                      }}
                    />
                  </label>

                  <label>
                    <span>
                      Starting Weekday
                    </span>

                    <select
                      value={
                        activeEra.startingWeekday
                      }
                      onChange={(
                        event
                      ) => {
                        const startingWeekday =
                          event.target.value;

                        controller.updateActiveEra(
                          (current) => ({
                            ...current,
                            startingWeekday,
                          })
                        );
                      }}
                    >
                      {activeEra.dayNames.map(
                        (dayName) => (
                          <option
                            key={dayName}
                            value={dayName}
                          >
                            {dayName}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>
              </div>

              <div className="sim-clock-settings-column">
                <h3>Display</h3>

                <div className="sim-clock-display-settings">
                  <div className="sim-clock-date-format-settings">
                    <label>
                      <span>
                        Date Format
                      </span>

                      <input
                        ref={
                          dateFormatInputRef
                        }
                        type="text"
                        value={
                          activeEra.dateFormat
                        }
                        onChange={(
                          event
                        ) => {
                          const dateFormat =
                            event
                              .target
                              .value;

                          controller.updateActiveEra(
                            (
                              current
                            ) => ({
                              ...current,
                              dateFormat,
                            })
                          );
                        }}
                      />
                    </label>

                    <div className="sim-clock-format-builder">
                      <select
                        value={
                          dateFormatField
                        }
                        onChange={(
                          event
                        ) =>
                          setDateFormatField(
                            event
                              .target
                              .value as
                              DateFormatField
                          )
                        }
                      >
                        {DATE_FORMAT_FIELDS.map(
                          (field) => (
                            <option
                              key={
                                field.value
                              }
                              value={
                                field.value
                              }
                            >
                              {
                                field.label
                              }
                            </option>
                          )
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={
                          addDateFormatField
                        }
                      >
                        Add
                      </button>

                      <div className="sim-clock-format-preview">
                        {formatDatePreview(
                          activeEra.dateFormat
                        )}
                      </div>
                    </div>
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