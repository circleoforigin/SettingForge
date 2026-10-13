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

  private initializing = false;
  private expectedPieceCount: number | undefined;

  beginOperation(): void
  {
    this.prospects.clear();

    this.initializing = true;
    this.expectedPieceCount = undefined;
  }

  finishInitialization(
    expectedPieceCount: number
  ): void
  {
    this.expectedPieceCount =
      Math.max(
        0,
        Math.trunc(
          expectedPieceCount
        )
      );

    this.initializing = false;
  }

  isInitializing(): boolean
  {
    return this.initializing;
  }

  isOperationComplete(): boolean
  {
    if (
      this.initializing ||
      this.expectedPieceCount === undefined ||
      this.prospects.size !==
        this.expectedPieceCount
    )
    {
      return false;
    }

    if (this.expectedPieceCount === 0)
    {
      return true;
    }

    return this.areAllComplete();
  }

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

    this.initializing = false;
    this.expectedPieceCount = undefined;
  }
}

export const stationaryTimeProspectService =
  new StationaryTimeProspectService();