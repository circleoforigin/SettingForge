import { useEffect, useState } from 'react';
import type { Occurrence } from '@settingforge/module-sdk';
import { occurrenceService } from './OccurrenceService';

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
  const [maxQueued, setMaxQueued] =
    useState(5);

  const [occurrences, setOccurrences] =
    useState<Occurrence[]>(() =>
      occurrenceService.getVisibleNext(maxQueued)
    );

  useEffect(() =>
  {
    const refresh = () =>
    {
      setOccurrences(
      occurrenceService.getVisibleNext(maxQueued)
      );
    };

    refresh();

    return occurrenceService.subscribe(
      refresh
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