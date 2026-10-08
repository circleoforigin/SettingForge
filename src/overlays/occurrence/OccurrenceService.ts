import type { Occurrence } from '@settingforge/module-sdk';

export const OCCURRENCE_BACKLOG = 50;
export const OCCURRENCE_REFRESH_LIMIT = 30;

type OccurrenceListener = () => void;

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

  removeProspect(prospectId: string): number
  {
    let removed =
      removeOccurrences(
        this.globalQueue,
        (occurrence) =>
          occurrence.prospectId ===
          prospectId
      );

    for (
      const [
        pieceId,
        queue,
      ] of this.pieceQueues
    )
    {
      removed +=
        removeOccurrences(
          queue,
          (occurrence) =>
            occurrence.prospectId ===
            prospectId
        );

      if (queue.length === 0)
      {
        this.pieceQueues.delete(pieceId);
      }
    }

    if (removed > 0)
{
  this.notify();
}

    return removed;
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

    getVisibleNext(maximum: number): Occurrence[]
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

    return this.getNext(
      this.getCount()
    )
      .filter(
        (occurrence) =>
          occurrence.type !== undefined &&
          occurrence.title !== undefined
      )
      .slice(
        0,
        limit
      );
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

  if (hadOccurrences)
  {
    this.notify();
  }
}
}

export const occurrenceService = new OccurrenceService();