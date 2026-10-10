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

  clear(): void
  {
    this.prospects.clear();
  }
}

export const travelProspectService =
  new TravelProspectService();