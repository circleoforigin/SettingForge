import type { OccurrenceRound } from './OccurrenceRound';
import { occurrenceProducerRegistry } from './OccurrenceProducerRegistry';
import type { Occurrence } from '@settingforge/module-sdk';

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
      occurrences: [],
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

  getRecalculate(
    pieceId: string
  ): Occurrence | undefined
  {
    const round = this.rounds.get(pieceId);

    if (
      !round ||
      round.state !== 'complete'
    )
    {
      return undefined;
    }

    return round.occurrences.find(
      (occurrence) =>
        occurrence.reaction === 'recalculate'
    );
  }

  truncateAtRecalculate(
    pieceId: string
  ): Occurrence | undefined
  {
    const round = this.rounds.get(pieceId);

    if (
      !round ||
      round.state !== 'complete'
    )
    {
      return undefined;
    }

    const recalculate =
      round.occurrences.find(
        (occurrence) =>
          occurrence.reaction === 'recalculate'
      );

    if (!recalculate)
    {
      return undefined;
    }

    round.occurrences =
      round.occurrences.filter(
        (occurrence) =>
          occurrence.simulationTime <=
            recalculate.simulationTime
      );

    return recalculate;
  }

  addOccurrences(
    pieceId: string,
    occurrences: readonly Occurrence[]
  ): OccurrenceRound
  {
    const round = this.rounds.get(pieceId);

    if (!round)
    {
      throw new Error(
        `Piece "${pieceId}" has no active Occurrence round.`
      );
    }

    if (round.state !== 'pending')
    {
      throw new Error(
        `Piece "${pieceId}" Occurrence round is already complete.`
      );
    }

    round.occurrences.push(
      ...occurrences
    );

    round.occurrences.sort(
      (left, right) =>
        left.simulationTime -
          right.simulationTime ||
        left.id.localeCompare(right.id)
    );

    return this.clone(round);
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
      occurrences: [...round.occurrences],
    };
  }
}

export const occurrenceCoordinator = new OccurrenceCoordinator();