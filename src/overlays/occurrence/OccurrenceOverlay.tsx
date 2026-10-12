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
  const [maxQueued, setMaxQueued] = useState(5);

  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);

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
    occurrences,
  };
}

export type OccurrenceOverlayController =
  ReturnType<typeof useOccurrenceOverlay>;