import type { OccurrenceRound } from './OccurrenceRound';
import { occurrenceProducerRegistry } from './OccurrenceProducerRegistry';

export class OccurrenceCoordinator
{
  private readonly rounds = new Map<string, OccurrenceRound>();

  beginRound(pieceId: string): OccurrenceRound
  {
    const existing = this.rounds.get(pieceId);

    if (existing?.state === 'pending')
    {
      throw new Error(
        `Piece "${pieceId}" already has an active Occurrence round.`
      );
    }

    const round: OccurrenceRound = {
      pieceId,
      producerIds: occurrenceProducerRegistry.snapshot(),
      completedProducerIds: [],
      state: 'pending',
    };

    this.rounds.set(pieceId, round);
    this.updateState(round);

    return this.clone(round);
  }

  getRound(pieceId: string): OccurrenceRound | undefined
  {
    const round = this.rounds.get(pieceId);

    return round
      ? this.clone(round)
      : undefined;
  }

  completeProducer(
    pieceId: string,
    producerId: string
  ): OccurrenceRound
  {
    const round = this.rounds.get(pieceId);

    if (!round)
    {
      throw new Error(
        `Piece "${pieceId}" has no active Occurrence round.`
      );
    }

    if (!round.producerIds.includes(producerId))
    {
      throw new Error(
        `Module "${producerId}" is not a producer for Piece "${pieceId}".`
      );
    }

    if (!round.completedProducerIds.includes(producerId))
    {
      round.completedProducerIds.push(producerId);
    }

    this.updateState(round);

    return this.clone(round);
  }

  removeRound(pieceId: string): boolean
  {
    return this.rounds.delete(pieceId);
  }

  clear(): void
  {
    this.rounds.clear();
  }

  private updateState(round: OccurrenceRound): void
  {
    round.state =
      round.completedProducerIds.length >= round.producerIds.length
        ? 'complete'
        : 'pending';
  }

  private clone(round: OccurrenceRound): OccurrenceRound
  {
    return {
      ...round,
      producerIds: [...round.producerIds],
      completedProducerIds: [...round.completedProducerIds],
    };
  }
}

export const occurrenceCoordinator = new OccurrenceCoordinator();