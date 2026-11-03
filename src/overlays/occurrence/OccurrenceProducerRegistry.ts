export class OccurrenceProducerRegistry
{
  private readonly producers = new Set<string>();
  private readonly globalProducers = new Set<string>();

  registerOverlay(
    overlayId: string
  ): void
  {
    this.register(
      `overlay:${overlayId}`
    );
  }

  unregisterOverlay(
    overlayId: string
  ): void
  {
    this.unregister(
      `overlay:${overlayId}`
    );
  }

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
  this.globalProducers.delete(moduleId);
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


registerGlobal(moduleId: string): void
{
  if (!moduleId)
  {
    throw new Error(
      'Global Occurrence producer requires a module ID.'
    );
  }

  this.globalProducers.add(moduleId);
}

unregisterGlobal(moduleId: string): void
{
  this.globalProducers.delete(moduleId);
}

snapshotGlobal(): string[]
{
  return Array.from(this.globalProducers).sort();
}

hasGlobal(moduleId: string): boolean
{
  return this.globalProducers.has(moduleId);
}

  clear(): void
  {
    this.producers.clear();
    this.globalProducers.clear();
  }
}

export const occurrenceProducerRegistry =
  new OccurrenceProducerRegistry();