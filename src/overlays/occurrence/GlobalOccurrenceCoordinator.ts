import type { Occurrence } from '@settingforge/module-sdk';
import type {
  GlobalOccurrenceRound,
  GlobalOccurrenceRoundState,
} from './GlobalOccurrenceRound';
import { occurrenceProducerRegistry } from './OccurrenceProducerRegistry';


type GlobalOccurrenceRoundListener =
  (
    round: GlobalOccurrenceRound
  ) => void;

export class GlobalOccurrenceCoordinator
{
  private round:
    GlobalOccurrenceRound | null =
      null;

  private readonly listeners =
    new Set<
      GlobalOccurrenceRoundListener
    >();

  beginRound(): GlobalOccurrenceRound
  {
    if (
      this.round?.state ===
      'pending'
    )
    {
      throw new Error(
        'A global Occurrence round is already active.'
      );
    }

    this.round = {
      producerIds:
        occurrenceProducerRegistry.snapshot(),

      completedProducerIds: [],
      occurrences: [],
      state: 'pending',
    };

    this.updateState();

    return this.clone(
      this.round
    );
  }

  getRound():
    GlobalOccurrenceRound | undefined
  {
    return this.round
      ? this.clone(this.round)
      : undefined;
  }

  addOccurrences(
    occurrences:
      readonly Occurrence[]
  ): GlobalOccurrenceRound
  {
    if (!this.round)
    {
      throw new Error(
        'There is no active global Occurrence round.'
      );
    }

    if (
      this.round.state !==
      'pending'
    )
    {
      throw new Error(
        'The global Occurrence round is already complete.'
      );
    }

    this.round.occurrences.push(
      ...occurrences
    );

    this.round.occurrences.sort(
      (left, right) =>
        left.simulationTime -
          right.simulationTime ||
        left.id.localeCompare(
          right.id
        )
    );

    return this.clone(
      this.round
    );
  }

  completeProducer(
    producerId: string
  ): GlobalOccurrenceRound
  {
    if (!this.round)
    {
      throw new Error(
        'There is no active global Occurrence round.'
      );
    }

    if (
      !this.round.producerIds.includes(
        producerId
      )
    )
    {
      throw new Error(
        `Module "${producerId}" is not a producer for the global Occurrence round.`
      );
    }

    if (
      !this.round
        .completedProducerIds
        .includes(
          producerId
        )
    )
    {
      this.round
        .completedProducerIds
        .push(
          producerId
        );
    }

    this.updateState();

    return this.clone(
      this.round
    );
  }

  takeCompletedRound():
    GlobalOccurrenceRound | undefined
  {
    if (
      !this.round ||
      this.round.state !==
        'complete'
    )
    {
      return undefined;
    }

    const round =
      this.clone(
        this.round
      );

    this.round = null;

    return round;
  }

  subscribe(
    listener:
      GlobalOccurrenceRoundListener
  ): () => void
  {
    this.listeners.add(
      listener
    );

    return () =>
    {
      this.listeners.delete(
        listener
      );
    };
  }

  clear(): void
  {
    this.round = null;
  }

  private updateState(): void
  {
    if (!this.round)
    {
      return;
    }

    const state:
      GlobalOccurrenceRoundState =
        this.round
          .completedProducerIds
          .length >=
        this.round
          .producerIds
          .length
          ? 'complete'
          : 'pending';

    const changed =
      this.round.state !==
      state;

    this.round.state =
      state;

    if (
      changed ||
      state === 'complete'
    )
    {
      const snapshot =
        this.clone(
          this.round
        );

      for (
        const listener
        of this.listeners
      )
      {
        listener(
          snapshot
        );
      }
    }
  }

  private clone(
    round: GlobalOccurrenceRound
  ): GlobalOccurrenceRound
  {
    return {
      ...round,

      producerIds: [
        ...round.producerIds,
      ],

      completedProducerIds: [
        ...round.completedProducerIds,
      ],

      occurrences: [
        ...round.occurrences,
      ],
    };
  }
}

export const globalOccurrenceCoordinator =
  new GlobalOccurrenceCoordinator();