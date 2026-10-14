import { useState } from 'react';
import type {
  Occurrence,
  OccurrenceType,
} from '@settingforge/module-sdk';
import {
  OCCURRENCE_MAX_QUEUED_OPTIONS,
  type OccurrenceOverlayController,
} from './OccurrenceOverlay';
import { occurrenceService } from './OccurrenceService';
import { occurrenceProcessor } from './OccurrenceProcessor';
import {
  formatSimulationMonthDay,
  formatSimulationTimeToMinute,
} from '../../simulation/SimCalendar';
import type { SimClockOverlayController } from '../simClock/SimClockOverlay';

interface OccurrenceSurfaceProps
{
  controller: OccurrenceOverlayController;
  simClock: SimClockOverlayController;
}

const OCCURRENCE_TYPE_LABELS:
  Record<OccurrenceType, string> = {
    encounter: 'E',
    weather: 'W',
    almanac: 'A',
    section: 'S',
    path: 'P',
    location: 'L',
    character: 'C',
  };

export function OccurrenceSurface({
  controller,
  simClock,
}: OccurrenceSurfaceProps)
{
  const [
    expandedOccurrenceIds,
    setExpandedOccurrenceIds,
  ] = useState<Set<string>>(
    () => new Set()
  );

  const toggleExpanded = (
    occurrenceId: string
  ) =>
  {
    setExpandedOccurrenceIds(
      (current) =>
      {
        const next = new Set(current);

        if (next.has(occurrenceId))
        {
          next.delete(occurrenceId);
        }
        else
        {
          next.add(occurrenceId);
        }

        return next;
      }
    );
  };

  const progressOccurrences = async () =>
  {
    const progressed =
      await occurrenceProcessor.progressOccurrences(
        controller.progressCount
      );

    if (!progressed)
    {
      return;
    }

    setExpandedOccurrenceIds(
      new Set()
    );
  };

  const clearOccurrences = () =>
  {
    occurrenceProcessor.clearOccurrences();

    setExpandedOccurrenceIds(
      new Set()
    );
  };

  const handleOccurrence = async (
    occurrence: Occurrence
  ) =>
  {
    await occurrenceProcessor.handleOccurrence(occurrence);

    setExpandedOccurrenceIds(
      (current) =>
      {
        const next = new Set(current);
        next.delete(occurrence.id);

        return next;
      }
    );
  };

  const dismissOccurrence = (
    occurrenceId: string
  ) =>
  {
    occurrenceService.remove(
      occurrenceId
    );

    setExpandedOccurrenceIds(
      (current) =>
      {
        const next = new Set(current);
        next.delete(occurrenceId);

        return next;
      }
    );
  };

  return (
    <div className="occurrence-surface">
               <div className="occurrence-header">
          <strong>Occurrences</strong>

          <div className="occurrence-header-controls">
            <div className="occurrence-progress-control">
              <button
                type="button"
                onClick={() =>
                {
                  void progressOccurrences();
                }}
              >
                Progress
              </button>

              <select
                aria-label="Occurrences to progress"
                value={controller.progressCount}
                onChange={(event) =>
                  controller.setProgressCount(
                    Number(event.target.value)
                  )
                }
              >
                {OCCURRENCE_MAX_QUEUED_OPTIONS
                  .filter(
                    (count) =>
                      count <=
                      controller.maxQueued
                  )
                  .map(
                    (count) => (
                      <option
                        key={count}
                        value={count}
                      >
                        {count}
                      </option>
                    )
                  )}
              </select>
            </div>

            <button
              type="button"
              onClick={clearOccurrences}
            >
              Clear
            </button>

            <label>
              <span>Max Queued</span>

              <select
                value={controller.maxQueued}
                onChange={(event) =>
                  controller.setMaxQueued(
                    Number(event.target.value)
                  )
                }
              >
                {OCCURRENCE_MAX_QUEUED_OPTIONS.map(
                  (maximum) => (
                    <option
                      key={maximum}
                      value={maximum}
                    >
                      {maximum}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        </div>

        <div className="occurrence-list">
          {controller.occurrences.map(
            (occurrence) =>
            {
                const expanded =
                expandedOccurrenceIds.has(
                  occurrence.id
                );

              return (
                <div
                  key={occurrence.id}
                  className={[
                    'occurrence-entry',
                    expanded
                      ? 'expanded'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="occurrence-entry-main">
                    <div className="occurrence-type">
                      {occurrence.displayLabel ??
                        (occurrence.type
                          ? OCCURRENCE_TYPE_LABELS[
                              occurrence.type
                            ]
                          : '')}
                    </div>

                    <div
  className={[
    'occurrence-summary',
    expanded
      ? 'expanded'
      : '',
  ]
    .filter(Boolean)
    .join(' ')}
>
  <span
    className="occurrence-description"
    role="button"
    tabIndex={0}
    aria-expanded={expanded}
    onClick={() =>
      toggleExpanded(
        occurrence.id
      )
    }
    onKeyDown={(event) =>
    {
      if (
        event.key !== 'Enter' &&
        event.key !== ' '
      )
      {
        return;
      }

      event.preventDefault();

      toggleExpanded(
        occurrence.id
      );
    }}
  >
    <strong className="occurrence-timestamp">
      {formatSimulationMonthDay(
        occurrence.simulationTime,
        simClock.activeEra
      )}
      {', '}
      {formatSimulationTimeToMinute(
        occurrence.simulationTime,
        simClock.activeEra
      )}
    </strong>
    {' — '}
    {occurrence.description ?? ''}
  </span>
</div>

                    <div className="occurrence-actions">
                      <button
                        type="button"
                        onClick={() =>
                        {
                          void handleOccurrence(
                            occurrence
                          );
                        }}
                      >
                        Handle
                      </button>

                      {occurrence.type ===
                        'encounter' && (
                        <button
                          type="button"
                          onClick={() =>
                            dismissOccurrence(
                              occurrence.id
                            )
                          }
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>                  
                </div>
              );
            }
          )}
        </div>
      </div> 
  );
}