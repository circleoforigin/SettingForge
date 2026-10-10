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

export class TravelProspectService
{
  private readonly prospects =
    new Map<string, PieceTravelProspect>();

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
  }
}

export const travelProspectService =
  new TravelProspectService();