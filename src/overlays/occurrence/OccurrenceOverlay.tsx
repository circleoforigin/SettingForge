import { useEffect, useState } from 'react';
import type { Occurrence } from '@settingforge/module-sdk';
import { occurrenceService } from './OccurrenceService';
import { hostEventBroker } from '../../events/HostEventBroker';
import { occurrenceProcessor } from './OccurrenceProcessor';
import { travelProspectService } from '../../simulation/TravelProspectService';
import { stationaryTimeProspectService } from '../../simulation/StationaryTimeProspectService';

export interface OccurrencePieceAppearance
{
  fillColor: string;
  borderColor: string;
}

export const OCCURRENCE_MAX_QUEUED_OPTIONS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,  
] as const;

export function useOccurrenceOverlay()
{
  const [maxQueued, setMaxQueuedState] = useState(5);
  const [progressCount, setProgressCountState] = useState(1);

  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);

  const [pieceAppearances, setPieceAppearances] =
    useState<Record<string, OccurrencePieceAppearance>>({});

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
        if (
          !occurrenceService
            .isPresentationActive()
        )
        {
          setOccurrences([]);

          return;
        }

        while (
          await occurrenceProcessor.processSilent()
        )
        {
          // Continue until the next Occurrence
          // requires presentation or interaction.
        }

        if (
          !occurrenceService
            .isPresentationActive()
        )
        {
          setOccurrences([]);

          return;
        }

        const visibleOccurrences =
          occurrenceService.getVisibleNext(
            maxQueued
          );

        setOccurrences(visibleOccurrences);

const refillPieceIds =
  new Set([
    ...travelProspectService
      .getStorageCursorPieceIds(),
    ...stationaryTimeProspectService
      .getStorageCursorPieceIds(),
  ]);

        for (const pieceId of refillPieceIds)
        {
          await occurrenceProcessor.refillPiece(pieceId);
        }

        occurrenceProcessor.completeStationaryTimeIfReady();
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

    useEffect(() =>
  {
    let cancelled = false;

    const pieceIds = [
      ...new Set(
        occurrences
          .map((occurrence) => occurrence.pieceId)
          .filter((pieceId): pieceId is string =>
            typeof pieceId === 'string'
          )
      ),
    ];

    if (pieceIds.length === 0)
    {
      setPieceAppearances({});
      return;
    }

    const loadAppearances = async () =>
    {
      const results = await Promise.allSettled(
        pieceIds.map(async (pieceId) =>
        {
          const appearance =
            await hostEventBroker.requestModule<
              OccurrencePieceAppearance
            >(
              'regions',
              'Regions.GetPieceAppearance',
              { pieceId }
            );

          return {
            pieceId,
            appearance,
          };
        })
      );

      if (cancelled)
      {
        return;
      }

      const appearances:
        Record<string, OccurrencePieceAppearance> = {};

      for (const result of results)
      {
        if (result.status !== 'fulfilled')
        {
          continue;
        }

        appearances[result.value.pieceId] =
          result.value.appearance;
      }

      setPieceAppearances(appearances);
    };

    void loadAppearances();

    return () =>
    {
      cancelled = true;
    };
  }, [occurrences]);

  return {
    maxQueued,
    setMaxQueued,
    progressCount,
    setProgressCount,
    occurrences,
    pieceAppearances,
  };
}

export type OccurrenceOverlayController =
  ReturnType<typeof useOccurrenceOverlay>;