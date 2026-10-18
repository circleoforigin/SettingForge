import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
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
    const surfaceRef =
    useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [position, setPosition] =
    useState<{
      x: number;
      y: number;
    } | null>(null);

  const [dragging, setDragging] =
    useState(false);

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

    const startDrag = (
    event: ReactPointerEvent<HTMLDivElement>
  ) =>
  {
    if (event.button !== 0)
    {
      return;
    }

    if (
      (event.target as HTMLElement).closest(
        'button, input, select, label, a'
      )
    )
    {
      return;
    }

    const surface = surfaceRef.current;

    if (!surface)
    {
      return;
    }

    const rect =
      surface.getBoundingClientRect();

    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

    setPosition({
      x: rect.left,
      y: rect.top,
    });

    setDragging(true);

    event.preventDefault();
  };

  const moveDrag = (
    event: ReactPointerEvent<HTMLDivElement>
  ) =>
  {
    const drag = dragRef.current;

    if (
      !drag ||
      drag.pointerId !== event.pointerId
    )
    {
      return;
    }

    const surface = surfaceRef.current;

    if (!surface)
    {
      return;
    }

    const maxX = Math.max(
      0,
      window.innerWidth - surface.offsetWidth
    );

    const maxY = Math.max(
      0,
      window.innerHeight - surface.offsetHeight
    );

    setPosition({
      x: Math.max(
        0,
        Math.min(
          maxX,
          event.clientX - drag.offsetX
        )
      ),
      y: Math.max(
        0,
        Math.min(
          maxY,
          event.clientY - drag.offsetY
        )
      ),
    });
  };

  const stopDrag = (
    event: ReactPointerEvent<HTMLDivElement>
  ) =>
  {
    if (
      dragRef.current?.pointerId !==
      event.pointerId
    )
    {
      return;
    }

    dragRef.current = null;
    setDragging(false);

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    )
    {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  };

  return (
    <div
      ref={surfaceRef}
      className="occurrence-surface"
      style={
        position
          ? {
              position: 'fixed',
              left: position.x,
              top: position.y,
              right: 'auto',
              bottom: 'auto',
              transform: 'none',
            }
          : undefined
      }
    >
<div
  className="occurrence-header"
  onPointerDown={startDrag}
  onPointerMove={moveDrag}
  onPointerUp={stopDrag}
  onPointerCancel={stopDrag}
  style={{
    cursor: dragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    userSelect: 'none',
  }}
>
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

              const appearance = occurrence.pieceId
                ? controller.pieceAppearances[occurrence.pieceId]
                : undefined;

              return (
                <div
                  key={occurrence.id}
                  className={[
                    'occurrence-entry',
                    expanded ? 'expanded' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
style={appearance
  ? {
      backgroundImage:
        `linear-gradient(
          to right,
          ${appearance.fillColor} 0%,
          color-mix(in srgb, ${appearance.fillColor} 70%, transparent) 20%,
          color-mix(in srgb, ${appearance.fillColor} 35%, transparent) 45%,
          transparent 75%
        )`,
    }
  : undefined}
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