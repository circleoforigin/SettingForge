import type { Occurrence } from '@settingforge/module-sdk';

function compareOccurrences(
  left: Occurrence,
  right: Occurrence
): number
{
  return (
    left.simulationTime -
      right.simulationTime ||
    left.id.localeCompare(right.id)
  );
}

function insertOccurrence(
  queue: Occurrence[],
  occurrence: Occurrence
): void
{
  const index =
    queue.findIndex(
      (candidate) =>
        compareOccurrences(
          occurrence,
          candidate
        ) < 0
    );

  if (index < 0)
  {
    queue.push(occurrence);

    return;
  }

  queue.splice(
    index,
    0,
    occurrence
  );
}

export class OccurrenceService
{
  private readonly globalQueue:
    Occurrence[] = [];

  private readonly pieceQueues =
    new Map<string, Occurrence[]>();

  add(
    occurrence: Occurrence
  ): void
  {
    if (!occurrence.pieceId)
    {
      insertOccurrence(
        this.globalQueue,
        occurrence
      );

      return;
    }

    let queue =
      this.pieceQueues.get(
        occurrence.pieceId
      );

    if (!queue)
    {
      queue = [];

      this.pieceQueues.set(
        occurrence.pieceId,
        queue
      );
    }

    insertOccurrence(
      queue,
      occurrence
    );
  }

  addMany(
    occurrences: readonly Occurrence[]
  ): void
  {
    for (const occurrence of occurrences)
    {
      this.add(occurrence);
    }
  }

  getNext(
    maximum: number
  ): Occurrence[]
  {
    const limit =
      Math.max(
        0,
        Math.trunc(maximum)
      );

    if (limit === 0)
    {
      return [];
    }

    const queues: Occurrence[][] = [
      this.globalQueue,
      ...this.pieceQueues.values(),
    ];

    const indexes =
      queues.map(() => 0);

    const result: Occurrence[] = [];

    while (result.length < limit)
    {
      let selectedQueue = -1;
      let selectedOccurrence:
        Occurrence | undefined;

      for (
        let index = 0;
        index < queues.length;
        index += 1
      )
      {
        const occurrence =
          queues[index][
            indexes[index]
          ];

        if (
          !occurrence ||
          (
            selectedOccurrence &&
            compareOccurrences(
              occurrence,
              selectedOccurrence
            ) >= 0
          )
        )
        {
          continue;
        }

        selectedQueue = index;
        selectedOccurrence =
          occurrence;
      }

      if (
        selectedQueue < 0 ||
        !selectedOccurrence
      )
      {
        break;
      }

      result.push(
        selectedOccurrence
      );

      indexes[selectedQueue] += 1;
    }

    return result;
  }

  getGlobalQueue(): Occurrence[]
  {
    return [
      ...this.globalQueue,
    ];
  }

  getPieceQueue(
    pieceId: string
  ): Occurrence[]
  {
    return [
      ...(
        this.pieceQueues.get(
          pieceId
        ) ??
        []
      ),
    ];
  }

  getPieceIds(): string[]
  {
    return Array.from(
      this.pieceQueues.keys()
    );
  }

  clear(): void
  {
    this.globalQueue.length = 0;
    this.pieceQueues.clear();
  }
}

export const occurrenceService =
  new OccurrenceService();