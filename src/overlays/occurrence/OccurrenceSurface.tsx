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
  formatSimulationDate,
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
    location: 'L',
    player: 'P',
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

                    <div className="occurrence-summary">
                      <span>
{formatSimulationDate(
  occurrence.simulationTime,
  simClock.activeEra
)}
{' '}
{formatSimulationTimeToMinute(
  occurrence.simulationTime,
  simClock.activeEra
)}
{' - '}
                        {occurrence.description ??
                          ''}
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

                  {expanded && (
                    <div className="occurrence-description">
                      {occurrence.description ??
                        'No description.'}
                    </div>
                  )}

                  <button
                    type="button"
                    className="occurrence-expand"
                    aria-label={
                      expanded
                        ? 'Collapse occurrence'
                        : 'Expand occurrence'
                    }
                    onClick={() =>
                      toggleExpanded(
                        occurrence.id
                      )
                    }
                  >
                    {expanded ? '▲' : '▼'}
                  </button>
                </div>
              );
            }
          )}
        </div>
      </div> 
  );
}