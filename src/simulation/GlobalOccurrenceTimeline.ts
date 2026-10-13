import type {
  Occurrence,
} from '@settingforge/module-sdk';

export const GLOBAL_OCCURRENCE_HORIZON_HOURS =
  48;

type GlobalOccurrenceTimelineListener =
  () => void;

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

export class GlobalOccurrenceTimeline
{
  private occurrences: Occurrence[] = [];

  private readonly listeners =
    new Set<
      GlobalOccurrenceTimelineListener
    >();

  getOccurrences(): Occurrence[]
  {
    return [
      ...this.occurrences,
    ];
  }

  replace(
    occurrences: readonly Occurrence[]
  ): void
  {
    this.occurrences = [
      ...occurrences,
    ].sort(compareOccurrences);

    this.notify();
  }

  removeBefore(
    simulationTime: number
  ): void
  {
    const next =
      this.occurrences.filter(
        (occurrence) =>
          occurrence.simulationTime >=
            simulationTime
      );

    if (
      next.length ===
      this.occurrences.length
    )
    {
      return;
    }

    this.occurrences = next;

    this.notify();
  }

  clear(): void
  {
    if (
      this.occurrences.length === 0
    )
    {
      return;
    }

    this.occurrences = [];

    this.notify();
  }

  subscribe(
    listener:
      GlobalOccurrenceTimelineListener
  ): () => void
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
}

export const globalOccurrenceTimeline =
  new GlobalOccurrenceTimeline();