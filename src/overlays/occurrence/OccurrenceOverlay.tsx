import { useEffect, useState } from 'react';
import type { Occurrence } from '@settingforge/module-sdk';
import { occurrenceService } from './OccurrenceService';
import { occurrenceProcessor } from './OccurrenceProcessor';
import { travelProspectService } from '../../simulation/TravelProspectService';

export const OCCURRENCE_MAX_QUEUED_OPTIONS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
] as const;

export function useOccurrenceOverlay()
{
  const [maxQueued, setMaxQueuedState] = useState(5);
  const [progressCount, setProgressCountState] = useState(1);

  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);

  const setMaxQueued = (
    maximum: number
  ) =>
  {
    const nextMaximum =
      Math.max(
        1,
        Math.min(
          10,
          Math.trunc(maximum)
        )
      );

    setMaxQueuedState(
      nextMaximum
    );

    setProgressCountState(
      (current) =>
        Math.min(
          current,
          nextMaximum
        )
    );
  };

  const setProgressCount = (
    count: number
  ) =>
  {
    setProgressCountState(
      Math.max(
        1,
        Math.min(
          Math.trunc(count),
          maxQueued
        )
      )
    );
  };

  useEffect(() =>
  {
    let processing = false;
    let refreshPending = false;

    const refresh = async () =>
    {
      if (processing)
      {
        refreshPending = true;

        return;
      }

      processing = true;

      try
      {
        while (
          await occurrenceProcessor.processSilent()
        )
        {
          // Continue until the next Occurrence
          // requires presentation or interaction.
        }

        const visibleOccurrences =
          occurrenceService.getVisibleNext(
            maxQueued
          );

        setOccurrences(visibleOccurrences);

        for (
          const pieceId of
            travelProspectService
              .getStorageCursorPieceIds()
        )
        {
          await occurrenceProcessor.refillPiece(
            pieceId
          );
        }
      }
      finally
      {
        processing = false;

        if (refreshPending)
        {
          refreshPending = false;
          void refresh();
        }
      }
    };

    void refresh();

    return occurrenceService.subscribe(
      () =>
      {
        void refresh();
      }
    );
  }, [maxQueued]);

  return {
    maxQueued,
    setMaxQueued,
    progressCount,
    setProgressCount,
    occurrences,
  };
}

export type OccurrenceOverlayController =
  ReturnType<typeof useOccurrenceOverlay>;