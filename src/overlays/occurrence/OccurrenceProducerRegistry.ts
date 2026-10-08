export class OccurrenceProducerRegistry
{
  private readonly producers =
    new Set<string>();

  register(moduleId: string): void
  {
    if (!moduleId)
    {
      throw new Error(
        'Occurrence producer requires a module ID.'
      );
    }

    this.producers.add(moduleId);
  }

  unregister(moduleId: string): void
  {
    this.producers.delete(moduleId);
  }

  has(moduleId: string): boolean
  {
    return this.producers.has(moduleId);
  }

  snapshot(): string[]
  {
    return Array.from(
      this.producers
    ).sort();
  }

  clear(): void
  {
    this.producers.clear();
  }
}

export const occurrenceProducerRegistry =
  new OccurrenceProducerRegistry();