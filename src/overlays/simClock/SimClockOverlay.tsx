import { useEffect, useRef, useState } from 'react';
import {
  simulationClockService,
  type SimulationTime,
} from '../../simulation/SimulationClockService';
import { hostEventBroker } from '../../events/HostEventBroker';
import {
  createDefaultSimClockSettings,
  type SimClockEra,
  type SimClockMarker,
  type SimClockProgressPreset,
  type SimClockSettings,
} from '../../simulation/SimClockSettings';
import type { OverlayMountId } from '../OverlayPlacement';
import { SimClockSurface } from './SimClockSurface';
import {
  advanceSimulationTimeToMarker,
  calendarToSimulationTime,
  progressSimulationTime,
  simulationTimeToCalendar,
  stepSimulationTime,
  type SimCalendarField,
} from '../../simulation/SimCalendar';
import { travelProspectService } from '../../simulation/TravelProspectService';
import { stationaryTimeProspectService } from '../../simulation/StationaryTimeProspectService';

import { occurrenceService } from '../occurrence/OccurrenceService';
import {
  extendGlobalOccurrences,
  rebuildGlobalOccurrences,
} from '../../simulation/SimClockGlobalOccurrences';
import { occurrenceCoordinator } from '../occurrence/OccurrenceCoordinator';
import {
  OccurrenceReactions,
  type Occurrence,
} from '@settingforge/module-sdk';

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

export type SimClockOverlayController = ReturnType<typeof useSimClockOverlay>;

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

useEffect(() =>
{
  if (!activeEra)
  {
    return;
  }

  rebuildGlobalOccurrences(
    simulationClockService.getTime(),
    {
      markers: settings.markers,
      era: activeEra,
    }
  );
}, [
  activeEra,
  settings.markers,
]);

useEffect(() =>
{
  if (!activeEra)
  {
    return;
  }

  extendGlobalOccurrences(
    committedTime,
    {
      markers: settings.markers,
      era: activeEra,
    }
  );
}, [
  committedTime,
  activeEra,
  settings.markers,
]);

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

const updateProgressPreset = (
  index: number,
  update: Partial<SimClockProgressPreset>
) =>
{
  setSettings((current) => ({
    ...current,

    progressPresets:
      current.progressPresets.map(
        (preset, presetIndex) =>
          presetIndex === index
            ? {
                ...preset,
                ...update,
              }
            : preset
      ),
  }));
};

const commitPendingTime = () =>
  {
    simulationClockService.setTime(
      pendingTime
    );
  };

const requestProgressTime = (
  targetTime: SimulationTime
) =>
{
  if (!activeEra)
  {
    return;
  }

  const startTime = simulationClockService.getTime();

  const duration = targetTime - startTime;

  console.log(
  '[SimClock Progress]',
  {
    committedTime,
    startTime,
    targetTime,
    duration,
  }
);

  if (duration <= 0)
  {
    return;
  }

  stationaryTimeProspectService.beginOperation(targetTime);

  occurrenceService.beginPresentation(targetTime);

const progressCompleteOccurrence:
  Occurrence = {
    id: crypto.randomUUID(),
    sourceModuleId: 'settingforge',
    simulationTime: targetTime,
    pieceId: null,
    entityId: null,
    sectorId: null,
    type: 'almanac',
    displayLabel: 'F',
    title: 'Progress Complete',
    description:
      'The requested time progression is complete.',
    reaction:
      OccurrenceReactions.Notify,
  };

occurrenceService.addVisible(progressCompleteOccurrence);

  hostEventBroker.broadcast(
    'Simulation.TimeProspected',
    {
      startTime,
      endTime: targetTime,
      duration,
    }
  );
};

const progressTime = (
  preset: SimClockProgressPreset
) =>
{
  if (!activeEra)
  {
    return;
  }

  const targetTime =
    progressSimulationTime(
      committedTime,
      preset.amount,
      preset.unit,
      activeEra
    );

    requestProgressTime(targetTime);
};

const progressToMarker = (
  marker: SimClockMarker
) =>
{
  if (!activeEra)
  {
    return;
  }

  const targetTime =
    advanceSimulationTimeToMarker(
      committedTime,
      marker,
      settings.markers,
      activeEra
    );

    requestProgressTime(targetTime);
};

const progressToMarkerAfter = (
  preset: SimClockProgressPreset,
  marker: SimClockMarker
) =>
{
  if (!activeEra)
  {
    return;
  }

  const progressedTime =
    progressSimulationTime(
      committedTime,
      preset.amount,
      preset.unit,
      activeEra
    );

  const targetTime =
    advanceSimulationTimeToMarker(
      progressedTime,
      marker,
      settings.markers,
      activeEra
    );

    requestProgressTime(targetTime);  
};

  const stepPendingTime = (
    field: SimCalendarField,
    direction: 1 | -1
  ) =>
  {
    if (!activeEra)
    {
        return;
    }

    setPendingTime((current) =>
        stepSimulationTime(
            current,
            field,
            direction,
            activeEra
        )
    );
  };

  const setPendingYear = (year: number) =>
  {
    if (!activeEra || !Number.isFinite(year))
    {
        return;
    }

    setPendingTime((current) =>
    {
        const calendar = simulationTimeToCalendar(
            current,
            activeEra
        );

        const month = activeEra.months[calendar.monthIndex];

        const firstOfMonth = calendarToSimulationTime(
        {
            year: Math.trunc(year),
            monthId: month.id,
            day: 1,
            hour: calendar.hour,
            minute: calendar.minute,
            second: calendar.second,
        },
        activeEra
        );

        const resolvedMonth = simulationTimeToCalendar(
            firstOfMonth,
            activeEra
        );

        const maximumDay = simulationTimeToCalendar(
            stepSimulationTime(
                firstOfMonth,
                'month',
                1,
                activeEra
            ) - activeEra.secondsPerMinute *
            activeEra.minutesPerHour *
            activeEra.hoursPerDay,
            activeEra
        ).day;

        return calendarToSimulationTime(
        {
            year: resolvedMonth.year,
            monthId: resolvedMonth.monthId,
            day: Math.min(calendar.day, maximumDay),
            hour: calendar.hour,
            minute: calendar.minute,
            second: calendar.second,
        },
        activeEra
        );
    });
  };

const requestTravel = () =>
{
  travelProspectService.clear();

  void hostEventBroker
    .requestModule<{
      accepted?: boolean;
      prospectedCount?: number;
    }>(
      'regions',
      'Regions.Travel',
      {
        startTime:
          simulationClockService.getTime(),
      }
    )
    .then((result) =>
    {
      if (
        !result?.accepted ||
        !result.prospectedCount
      )
      {
        occurrenceService
          .clearOperationOccurrences();

        occurrenceCoordinator.clear();
        travelProspectService.clear();

        return;
      }

      const throughTime =
        travelProspectService
          .getProspectedThroughTime();

      if (throughTime === undefined)
      {
        occurrenceService
          .clearOperationOccurrences();

        occurrenceCoordinator.clear();
        travelProspectService.clear();

        return;
      }

      occurrenceService.beginPresentation(
        throughTime
      );
    })
    .catch((error: unknown) =>
    {
      occurrenceService
        .clearOperationOccurrences();

      occurrenceCoordinator.clear();
      travelProspectService.clear();

      console.error(
        '[Simulation] Unable to begin Travel.',
        error
      );
    });
};

const restoreWorldState = (
  time: SimulationTime,
  settings: SimClockSettings
) =>
{
  const defaults =
    createDefaultSimClockSettings();

  const restoredSettings: SimClockSettings = {
    ...defaults,
    ...structuredClone(settings),

    progressPresets:
      settings.progressPresets
        ? structuredClone(
            settings.progressPresets
          )
        : defaults.progressPresets,

    markers:
      settings.markers
        ? {
            ...defaults.markers,
            ...structuredClone(
              settings.markers
            ),
          }
        : defaults.markers,
  };

  setSettings(restoredSettings);
  simulationClockService.setTime(time);
  setPendingTime(time);
};

  return {
    settingsOpen,
    setSettingsOpen,
    settings,
    setSettings,
    activeEra,
    updateActiveEra,
    updateProgressPreset,
    committedTime,
    pendingTime,
    setPendingTime,
    stepPendingTime,
    setPendingYear,
    commitPendingTime,
    progressTime,
    progressToMarker,
    progressToMarkerAfter,
    requestTravel,
    restoreWorldState,
  };
}

interface SimClockOverlayProps
{
  controller: SimClockOverlayController;
  mountId?: OverlayMountId;
}

export function SimClockOverlay({
  controller,
  mountId,
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
      {mountId && (
        <SimClockSurface
            controller={controller}
            mountId={mountId}
        />
      )}

      {controller.settingsOpen && (
        <div className="dialog-backdrop">
          <div className="dialog sim-clock-settings-dialog">
            <h2>SimClock Settings</h2>

            
<div className="sim-clock-settings-section">
  <h3>Calendar</h3>

  <div className="sim-clock-settings-columns">
    <div className="sim-clock-settings-column">
      <div className="sim-clock-basic-settings">
        {([
          ['Seconds per Minute', activeEra.secondsPerMinute],
          ['Minutes per Hour', activeEra.minutesPerHour],
          ['Hours per Day', activeEra.hoursPerDay],
        ] as const).map(([label, value]) => (
          <label key={label}>
            <span>{label}</span>
            <input
              type="text"
              value={value}
              readOnly
            />
          </label>
        ))}
      </div>

      <div className="sim-clock-leap-section">
        <label className="sim-clock-leap-toggle">
          <input
            type="checkbox"
            checked={!!activeEra.leapRule}
            disabled
          />
          <strong>Leap Day</strong>
        </label>

        {activeEra.leapRule && (
          <div className="sim-clock-leap-settings">
            {([
              ['Every', activeEra.leapRule.interval],
              ['Except Every', activeEra.leapRule.exceptEvery],
              ['Unless Every', activeEra.leapRule.unlessEvery],
              ['After Day', activeEra.leapRule.afterDay],
              ['Additional Days', activeEra.leapRule.additionalDays],
            ] as const).map(([label, value]) => (
              <label key={label}>
                <span>{label}</span>
                <input
                  type="text"
                  value={value ?? ''}
                  readOnly
                />
              </label>
            ))}

            <label>
              <span>Month</span>
              <input
                type="text"
                value={
                  activeEra.months.find(
                    (month) =>
                      month.id === activeEra.leapRule?.monthId
                  )?.name ?? ''
                }
                readOnly
              />
            </label>
          </div>
        )}
      </div>
    </div>

    <div className="sim-clock-settings-column">
      <div className="sim-clock-settings-list">
        <div className="sim-clock-list-header">
          <strong>Days</strong>
        </div>

        <div className="sim-clock-day-list">
          {activeEra.dayNames.map((dayName, index) => (
            <div
              key={index}
              className="sim-clock-settings-row"
            >
              <input
                type="text"
                value={dayName}
                readOnly
              />
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="sim-clock-settings-column">
      <div className="sim-clock-settings-list">
        <div className="sim-clock-list-header">
          <strong>Months</strong>
        </div>

        <div className="sim-clock-month-list">
          {activeEra.months.map((month) => (
            <div
              key={month.id}
              className="sim-clock-settings-row"
            >
              <input
                type="text"
                value={month.name}
                readOnly
              />
              <input
                type="text"
                title="Days"
                value={month.days}
                readOnly
              />
            </div>
          ))}
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

                    
<input
  type="text"
  value={activeEra.startingWeekday}
  readOnly
/>

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