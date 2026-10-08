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

interface OccurrenceSurfaceProps
{
  controller: OccurrenceOverlayController;
}

const OCCURRENCE_TYPE_LABELS:
  Record<OccurrenceType, string> = {
    encounter: 'E',
    weather: 'W',
    almanac: 'A',
    section: 'S',
    player: 'P',
  };

export function OccurrenceSurface({
  controller,
}: OccurrenceSurfaceProps)
{
  const [
    expandedOccurrenceIds,
    setExpandedOccurrenceIds,
  ] = useState<Set<string>>(
    () => new Set()
  );

  const [
    handledOccurrence,
    setHandledOccurrence,
  ] = useState<Occurrence | null>(null);

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
    <>
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
                      {
                        OCCURRENCE_TYPE_LABELS[
                          occurrence.type
                        ]
                      }
                    </div>

                    <div className="occurrence-summary">
                      <strong>
                        {occurrence.title}
                      </strong>

                      <span>
                        {occurrence.description ??
                          ''}
                      </span>
                    </div>

                    <div className="occurrence-actions">
                      <button
                        type="button"
                        onClick={() =>
                          setHandledOccurrence(
                            occurrence
                          )
                        }
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

      {handledOccurrence && (
        <div className="dialog-backdrop">
          <div className="dialog occurrence-dialog">
            <h2>
              {handledOccurrence.title}
            </h2>

            <p>
              {handledOccurrence.description ??
                'No description.'}
            </p>

            <div className="occurrence-dialog-details">
              <div>
                <strong>Type:</strong>{' '}
                {handledOccurrence.type}
              </div>

              <div>
                <strong>Simulation Time:</strong>{' '}
                {handledOccurrence.simulationTime}
              </div>

              <div>
                <strong>Source:</strong>{' '}
                {handledOccurrence.sourceModuleId}
              </div>

              <div>
                <strong>Tags:</strong>{' '}
                {handledOccurrence.tags.join(', ') ||
                  'None'}
              </div>
            </div>

            <div className="dialog-buttons">
              <button
                type="button"
                onClick={() =>
                  setHandledOccurrence(null)
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