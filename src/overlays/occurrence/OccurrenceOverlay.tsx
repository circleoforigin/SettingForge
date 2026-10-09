import { useEffect, useState } from 'react';
import type { Occurrence } from '@settingforge/module-sdk';
import { occurrenceService } from './OccurrenceService';
import { occurrenceProcessor } from './OccurrenceProcessor';

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

    const refresh = async () =>
    {
      if (processing)
      {
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

        setOccurrences(
          occurrenceService.getVisibleNext(
            maxQueued
          )
        );
      }
      finally
      {
        processing = false;
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