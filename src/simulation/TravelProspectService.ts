export interface TravelProspectInterval
{
  routeLegId: string;
  startTime: number;
  endTime: number;
  startDistanceFromLegStart: number;
  endDistanceFromLegStart: number;
}

export interface PieceTravelProspect
{
  pieceId: string;
  intervals: TravelProspectInterval[];
}

export interface ResolvedTravelPosition
{
  pieceId: string;
  routeLegId: string;
  distanceFromLegStart: number;
}

export interface TravelProspectCursor
{
  pieceId: string;
  routeLegId: string;
  simulationTime: number;
  distanceFromLegStart: number;
  atLegEnd: boolean;
}

export class TravelProspectService
{
  private readonly prospects = new Map<string, PieceTravelProspect>();
  private readonly storageCursors = new Map<string, TravelProspectCursor>();
  private readonly completedPieces = new Set<string>();

  addInterval(
    pieceId: string,
    interval: TravelProspectInterval
  ): void
  {
    let prospect =
      this.prospects.get(pieceId);

    if (!prospect)
    {
      prospect = {
        pieceId,
        intervals: [],
      };

      this.prospects.set(
        pieceId,
        prospect
      );
    }

    prospect.intervals.push({
      ...interval,
    });

    prospect.intervals.sort(
      (left, right) =>
        left.startTime -
          right.startTime ||
        left.endTime -
          right.endTime
    );
  }

  truncateLatestInterval(
    pieceId: string,
    endTime: number,
    endDistanceFromLegStart: number
  ): void
  {
    const prospect =
      this.prospects.get(pieceId);

    if (
      !prospect ||
      prospect.intervals.length === 0
    )
    {
      return;
    }

    const interval =
      prospect.intervals[
        prospect.intervals.length - 1
      ];

   
    interval.endTime = endTime;
    interval.endDistanceFromLegStart =
      endDistanceFromLegStart;
  }

   truncateAtTime(
    pieceId: string,
    simulationTime: number
  ): TravelProspectCursor | undefined
  {
    const prospect =
      this.prospects.get(pieceId);

    if (
      !prospect ||
      prospect.intervals.length === 0
    )
    {
      return undefined;
    }

    const intervalIndex =
      prospect.intervals.findIndex(
        (candidate) =>
          simulationTime >=
            candidate.startTime &&
          simulationTime <=
            candidate.endTime
      );

    if (intervalIndex < 0)
    {
      return undefined;
    }

    const interval =
      prospect.intervals[
        intervalIndex
      ];

    const originalEndTime = interval.endTime;
    const atLegEnd = simulationTime >= originalEndTime;

    const duration =
      interval.endTime -
      interval.startTime;

    const progress =
      duration > 0
        ? Math.max(
            0,
            Math.min(
              1,
              (
                simulationTime -
                interval.startTime
              ) / duration
            )
          )
        : 1;

    const distanceFromLegStart =
      interval.startDistanceFromLegStart +
      (
        interval.endDistanceFromLegStart -
        interval.startDistanceFromLegStart
      ) *
      progress;

    interval.endTime =
      simulationTime;

    interval.endDistanceFromLegStart =
      distanceFromLegStart;

    prospect.intervals.splice(
      intervalIndex + 1
    );

    return {
      pieceId,
      routeLegId:
        interval.routeLegId,
      simulationTime,
      distanceFromLegStart,
      atLegEnd,
    };
  } 

  getProspect(
    pieceId: string
  ): PieceTravelProspect | undefined
  {
    const prospect =
      this.prospects.get(pieceId);

    if (!prospect)
    {
      return undefined;
    }

    return {
      pieceId: prospect.pieceId,
      intervals:
        prospect.intervals.map(
          (interval) => ({
            ...interval,
          })
        ),
    };
  }

  getProspects(): PieceTravelProspect[]
  {
    return Array.from(
      this.prospects.values(),
      (prospect) => ({
        pieceId: prospect.pieceId,
        intervals:
          prospect.intervals.map(
            (interval) => ({
              ...interval,
            })
          ),
      })
    );
  }

  setStorageCursor(
    cursor: TravelProspectCursor
  ): void
  {
    this.storageCursors.set(
      cursor.pieceId,
      {
        ...cursor,
      }
    );
  }

  getStorageCursor(
    pieceId: string
  ): TravelProspectCursor | undefined
  {
    const cursor =
      this.storageCursors.get(
        pieceId
      );

    return cursor
      ? {
          ...cursor,
        }
      : undefined;
  }

  getStorageCursorPieceIds(): string[]
  {
    return Array.from(
      this.storageCursors.keys()
    );
  }

  markRouteComplete(
    pieceId: string
  ): void
  {
    this.completedPieces.add(
      pieceId
    );
  }

  isRouteComplete(
    pieceId: string
  ): boolean
  {
    return this.completedPieces.has(
      pieceId
    );
  }
  
  getLatestCursor(
    pieceId: string
  ): TravelProspectCursor | undefined
  {
    const prospect =
      this.prospects.get(pieceId);

    if (
      !prospect ||
      prospect.intervals.length === 0
    )
    {
      return undefined;
    }

    const interval =
      prospect.intervals[
        prospect.intervals.length - 1
      ];

    return {
      pieceId,
      routeLegId: interval.routeLegId,
      simulationTime: interval.endTime,
      distanceFromLegStart:
        interval.endDistanceFromLegStart,
      atLegEnd: true,
    };
  }

  resolvePositionsAt(
    simulationTime: number
  ): ResolvedTravelPosition[]
  {
    const positions:
      ResolvedTravelPosition[] = [];

    for (const prospect of this.prospects.values())
    {
      const intervals =
        prospect.intervals;

      if (intervals.length === 0)
      {
        continue;
      }

      const interval =
        intervals.find(
          (candidate) =>
            simulationTime >=
              candidate.startTime &&
            simulationTime <=
              candidate.endTime
        );

      if (interval)
      {
        const duration =
          interval.endTime -
          interval.startTime;

        const progress =
          duration > 0
            ? Math.max(
                0,
                Math.min(
                  1,
                  (
                    simulationTime -
                    interval.startTime
                  ) / duration
                )
              )
            : 1;

        const distanceFromLegStart =
          interval.startDistanceFromLegStart +
          (
            interval.endDistanceFromLegStart -
            interval.startDistanceFromLegStart
          ) *
          progress;

        positions.push({
          pieceId: prospect.pieceId,
          routeLegId: interval.routeLegId,
          distanceFromLegStart,
        });

        continue;
      }

      const lastInterval =
        intervals[
          intervals.length - 1
        ];

      if (
        simulationTime >
        lastInterval.endTime
      )
      {
        positions.push({
          pieceId: prospect.pieceId,
          routeLegId:
            lastInterval.routeLegId,
          distanceFromLegStart:
            lastInterval
              .endDistanceFromLegStart,
        });
      }
    }

    return positions;
  }

  clear(): void
  {
    this.prospects.clear();
    this.storageCursors.clear();
    this.completedPieces.clear();
  }
}

export const travelProspectService =
  new TravelProspectService();