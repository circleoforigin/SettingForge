import type { OccurrenceProspect } from './OccurrenceProspect';
import { occurrenceProducerRegistry } from './OccurrenceProducerRegistry';

export class OccurrenceCoordinator
{
  private readonly prospects = new Map<string, OccurrenceProspect>();

  createProspect(): OccurrenceProspect
  {
    const prospect: OccurrenceProspect = {
      id: crypto.randomUUID(),
      producerIds: occurrenceProducerRegistry.snapshot(),
      completedProducerIds: [],
      state: 'pending',
    };

    this.prospects.set(prospect.id, prospect);
    this.updateState(prospect);

    return this.clone(prospect);
  }

  getProspect(prospectId: string): OccurrenceProspect | undefined
  {
    const prospect = this.prospects.get(prospectId);

    return prospect
      ? this.clone(prospect)
      : undefined;
  }

  completeProducer(
    prospectId: string,
    producerId: string
  ): OccurrenceProspect
  {
    const prospect = this.prospects.get(prospectId);

    if (!prospect)
    {
      throw new Error(
        `Occurrence prospect "${prospectId}" does not exist.`
      );
    }

    if (!prospect.producerIds.includes(producerId))
    {
      throw new Error(
        `Module "${producerId}" is not a producer for Occurrence prospect "${prospectId}".`
      );
    }

    if (!prospect.completedProducerIds.includes(producerId))
    {
      prospect.completedProducerIds.push(producerId);
    }

    this.updateState(prospect);

    return this.clone(prospect);
  }

  cancelProspect(prospectId: string): void
  {
    this.prospects.delete(prospectId);
  }

  clear(): void
  {
    this.prospects.clear();
  }

  private updateState(prospect: OccurrenceProspect): void
  {
    prospect.state =
      prospect.completedProducerIds.length >= prospect.producerIds.length
        ? 'complete'
        : 'pending';
  }

  private clone(prospect: OccurrenceProspect): OccurrenceProspect
  {
    return {
      ...prospect,
      producerIds: [...prospect.producerIds],
      completedProducerIds: [...prospect.completedProducerIds],
    };
  }
}

export const occurrenceCoordinator = new OccurrenceCoordinator();