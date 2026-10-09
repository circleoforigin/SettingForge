import type { Occurrence } from '@settingforge/module-sdk';

export const PIECE_OCCURRENCE_LIMIT = 10;
export const PIECE_OCCURRENCE_REFRESH_LIMIT = 5;

type OccurrenceListener = () => void;

export function isDisplayableOccurrence(
  occurrence: Occurrence
): boolean
{
  return (
    occurrence.type !== undefined &&
    occurrence.description !== undefined
  );
}

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

function removeOccurrences(
  queue: Occurrence[],
  predicate: (occurrence: Occurrence) => boolean
): number
{
  let removed = 0;

  for (
    let index = queue.length - 1;
    index >= 0;
    index -= 1
  )
  {
    if (!predicate(queue[index]))
    {
      continue;
    }

    queue.splice(
      index,
      1
    );

    removed += 1;
  }

  return removed;
}

export class OccurrenceService
{
private readonly globalQueue: Occurrence[] = [];
private readonly pieceQueues = new Map<string, Occurrence[]>();
private readonly visibleOccurrences: Occurrence[] = [];
private readonly listeners = new Set<OccurrenceListener>();

subscribe(listener: OccurrenceListener): () => void
{
  this.listeners.add(listener);

  return () =>
  {
    this.listeners.delete(listener);
  };
}

private notify(): void
{
  for (const listener of this.listeners)
  {
    listener();
  }
}
  
add(occurrence: Occurrence): void
{
  this.insert(occurrence);
  this.notify();
}

private insert(occurrence: Occurrence): void
{
  if (!occurrence.pieceId)
  {
    insertOccurrence(
      this.globalQueue,
      occurrence
    );

    return;
  }

  let queue = this.pieceQueues.get(occurrence.pieceId);

  if (!queue)
  {
    queue = [];
    this.pieceQueues.set(occurrence.pieceId, queue);
  }

  insertOccurrence(
    queue,
    occurrence
  );
}

addMany(occurrences: readonly Occurrence[]): void
{
  if (occurrences.length === 0)
  {
    return;
  }

  for (const occurrence of occurrences)
  {
    this.insert(occurrence);
  }

  this.notify();
}

  remove(occurrenceId: string): boolean
  {
    const visibleRemoved =
      removeOccurrences(
        this.visibleOccurrences,
        (occurrence) =>
          occurrence.id === occurrenceId
      );

    if (visibleRemoved > 0)
    {
      this.notify();

      return true;
    }
   
    const globalRemoved =
      removeOccurrences(
        this.globalQueue,
        (occurrence) =>
          occurrence.id === occurrenceId
      );

if (globalRemoved > 0)
{
  this.notify();

  return true;
}

    for (
      const [
        pieceId,
        queue,
      ] of this.pieceQueues
    )
    {
      const removed =
        removeOccurrences(
          queue,
          (occurrence) =>
            occurrence.id === occurrenceId
        );

      if (queue.length === 0)
      {
        this.pieceQueues.delete(pieceId);
      }

if (removed > 0)
{
  this.notify();

  return true;
}
    }

    return false;
  }

  truncatePiece(
    pieceId: string,
    simulationTime: number
  ): number
  {
    const queue = this.pieceQueues.get(pieceId);

    if (!queue)
    {
      return 0;
    }

    const removed =
      removeOccurrences(
        queue,
        (occurrence) =>
          occurrence.simulationTime >
          simulationTime
      );

    if (queue.length === 0)
    {
      this.pieceQueues.delete(pieceId);
    }

    if (removed > 0)
{
  this.notify();
}

    return removed;
  }  
  
  peek(): Occurrence | null
  {
    return this.getNext(1)[0] ?? null;
  }

  fillVisible(maximum: number): Occurrence[]
  {
    const limit =
      Math.max(
        0,
        Math.trunc(maximum)
      );

    while (
      this.visibleOccurrences.length <
      limit
    )
    {
      const next =
        this.getNext(1)[0];

      if (!next)
      {
        break;
      }

      if (!isDisplayableOccurrence(next))
      {
        break;
      }

      if (next.pieceId)
      {
        this.takePieceOccurrence(
          next.pieceId,
          next.id
        );
      }
      else
      {
        removeOccurrences(
          this.globalQueue,
          (occurrence) =>
            occurrence.id === next.id
        );
      }

      insertOccurrence(
        this.visibleOccurrences,
        next
      );
    }

    return this.visibleOccurrences.slice(
      0,
      limit
    );
  }

  getVisibleNext(maximum: number): Occurrence[]
  {
    return this.fillVisible(maximum);
  }

  getCount(): number
  {
    let count =
      this.globalQueue.length;

    for (const queue of this.pieceQueues.values())
    {
      count += queue.length;
    }

    return count;
  }

  getNext(maximum: number): Occurrence[]
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

    const indexes = queues.map(() => 0);

    const result: Occurrence[] = [];

    while (result.length < limit)
    {
      let selectedQueue = -1;
      let selectedOccurrence: Occurrence | undefined;

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
        selectedOccurrence = occurrence;
      }

      if (
        selectedQueue < 0 ||
        !selectedOccurrence
      )
      {
        break;
      }

      result.push(selectedOccurrence);

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

  getPieceDisplayableCount(pieceId: string): number
  {
    return this.getPieceQueue(pieceId)
      .filter(isDisplayableOccurrence)
      .length;
  }

    getPieceDisplayableBoundary(
    pieceId: string,
    maximum = PIECE_OCCURRENCE_LIMIT
  ): Occurrence | undefined
  {
    let count = 0;

    for (const occurrence of this.getPieceQueue(pieceId))
    {
      if (!isDisplayableOccurrence(occurrence))
      {
        continue;
      }

      count += 1;

      if (count === maximum)
      {
        return occurrence;
      }
    }

    return undefined;
  }

  getPieceQueue(pieceId: string): Occurrence[]
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

  takePieceOccurrence(
    pieceId: string,
    occurrenceId: string
  ): Occurrence | undefined
  {
    const queue =
      this.pieceQueues.get(pieceId);

    if (!queue)
    {
      return undefined;
    }

    const index =
      queue.findIndex(
        (occurrence) =>
          occurrence.id === occurrenceId
      );

    if (index < 0)
    {
      return undefined;
    }

    const [occurrence] =
      queue.splice(index, 1);

    if (queue.length === 0)
    {
      this.pieceQueues.delete(pieceId);
    }

    return occurrence;
  }

  getPieceIds(): string[]
  {
    return Array.from(this.pieceQueues.keys());
  }

clear(): void
{
  const hadOccurrences =
    this.globalQueue.length > 0 ||
    this.pieceQueues.size > 0;

  this.globalQueue.length = 0;
  this.pieceQueues.clear();
  this.visibleOccurrences.length = 0;

  if (hadOccurrences)
  {
    this.notify();
  }
}
}

export const occurrenceService = new OccurrenceService();