import type { OccurrenceRound } from './OccurrenceRound';
import { occurrenceProducerRegistry } from './OccurrenceProducerRegistry';
import type { Occurrence } from '@settingforge/module-sdk';
import type { OccurrenceProspect } from './OccurrenceProspect';

export class OccurrenceCoordinator
{
  private readonly rounds = new Map<string, OccurrenceRound>();
  private readonly prospects =
    new Map<string, OccurrenceProspect>();

  getProspect(
    pieceId: string
  ): OccurrenceProspect | undefined
  {
    const prospect =
      this.prospects.get(pieceId);

    return prospect
      ? this.cloneProspect(prospect)
      : undefined;
  }

  getProspectDisplayableCount(
    pieceId: string
  ): number
  {
    const prospect =
      this.prospects.get(pieceId);

    if (!prospect)
    {
      return 0;
    }

    return prospect.occurrences.filter(
      (occurrence) =>
        occurrence.type !== undefined &&
        occurrence.title !== undefined
    ).length;
  }

  getProspectDisplayableBoundary(
    pieceId: string,
    maximum: number
  ): Occurrence | undefined
  {
    const prospect =
      this.prospects.get(pieceId);

    if (!prospect)
    {
      return undefined;
    }

    let count = 0;

    for (const occurrence of prospect.occurrences)
    {
      if (
        occurrence.type === undefined ||
        occurrence.title === undefined
      )
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

  addProspectOccurrences(
    pieceId: string,
    occurrences: readonly Occurrence[]
  ): OccurrenceProspect
  {
    let prospect =
      this.prospects.get(pieceId);

    if (!prospect)
    {
      prospect = {
        pieceId,
        occurrences: [],
      };

      this.prospects.set(
        pieceId,
        prospect
      );
    }

    prospect.occurrences.push(
      ...occurrences
    );

    prospect.occurrences.sort(
      (left, right) =>
        left.simulationTime -
          right.simulationTime ||
        left.id.localeCompare(right.id)
    );

    return this.cloneProspect(
      prospect
    );
  }

  takeProspect(
    pieceId: string
  ): OccurrenceProspect | undefined
  {
    const prospect =
      this.prospects.get(pieceId);

    if (!prospect)
    {
      return undefined;
    }

    this.prospects.delete(pieceId);

    return this.cloneProspect(
      prospect
    );
  }

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

  takeCompletedRound(
    pieceId: string
  ): OccurrenceRound | undefined
  {
    const round = this.rounds.get(pieceId);

    if (
      !round ||
      round.state !== 'complete'
    )
    {
      return undefined;
    }

    this.rounds.delete(pieceId);

    return this.clone(round);
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
    this.prospects.clear();
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

  private cloneProspect(
    prospect: OccurrenceProspect
  ): OccurrenceProspect
  {
    return {
      ...prospect,
      occurrences: [
        ...prospect.occurrences,
      ],
    };
  }
}

export const occurrenceCoordinator = new OccurrenceCoordinator();