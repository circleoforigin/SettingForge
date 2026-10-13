export interface PieceStationaryTimeProspect
{
  pieceId: string;
  startTime: number;
  targetTime: number;
  storageCursorTime: number;
  complete: boolean;
}

export class StationaryTimeProspectService
{
  private readonly prospects =
    new Map<
      string,
      PieceStationaryTimeProspect
    >();

  begin(
    pieceId: string,
    startTime: number,
    targetTime: number
  ): void
  {
    this.prospects.set(
      pieceId,
      {
        pieceId,
        startTime,
        targetTime,
        storageCursorTime:
          startTime,
        complete: false,
      }
    );
  }

  getProspect(
    pieceId: string
  ): PieceStationaryTimeProspect | undefined
  {
    const prospect =
      this.prospects.get(pieceId);

    return prospect
      ? {
          ...prospect,
        }
      : undefined;
  }

  getProspects():
    PieceStationaryTimeProspect[]
  {
    return Array.from(
      this.prospects.values(),
      (prospect) => ({
        ...prospect,
      })
    );
  }

  setStorageCursor(
    pieceId: string,
    simulationTime: number
  ): void
  {
    const prospect =
      this.prospects.get(pieceId);

    if (!prospect)
    {
      return;
    }

    prospect.storageCursorTime =
      Math.max(
        prospect.startTime,
        Math.min(
          simulationTime,
          prospect.targetTime
        )
      );
  }

  getStorageCursor(
    pieceId: string
  ): number | undefined
  {
    return this.prospects.get(
      pieceId
    )?.storageCursorTime;
  }

  getStorageCursorPieceIds(): string[]
  {
    return Array.from(
      this.prospects.keys()
    );
  }

  markComplete(
    pieceId: string
  ): void
  {
    const prospect =
      this.prospects.get(pieceId);

    if (!prospect)
    {
      return;
    }

    prospect.storageCursorTime =
      prospect.targetTime;

    prospect.complete = true;
  }

  isComplete(
    pieceId: string
  ): boolean
  {
    return (
      this.prospects.get(
        pieceId
      )?.complete === true
    );
  }

  areAllComplete(): boolean
  {
    if (this.prospects.size === 0)
    {
      return false;
    }

    for (
      const prospect
      of this.prospects.values()
    )
    {
      if (!prospect.complete)
      {
        return false;
      }
    }

    return true;
  }

  getTargetTime(): number | undefined
  {
    let targetTime:
      number | undefined;

    for (
      const prospect
      of this.prospects.values()
    )
    {
      if (targetTime === undefined)
      {
        targetTime =
          prospect.targetTime;

        continue;
      }

      if (
        prospect.targetTime !==
        targetTime
      )
      {
        return undefined;
      }
    }

    return targetTime;
  }

  clear(): void
  {
    this.prospects.clear();
  }
}

export const stationaryTimeProspectService =
  new StationaryTimeProspectService();