import type { RulesetEntityFact } from './RulesetDefinition';

interface MovementFact
{
  speed: number;
}

export class EntityFactService
{
  async request<T = unknown>(
    entityIds: readonly string[],
    fact: string
  ): Promise<RulesetEntityFact<T>[]>
  {
    const uniqueEntityIds =
      [...new Set(entityIds)];

    const results =
      await Promise.all(
        uniqueEntityIds.map(
          (entityId) =>
            this.requestEntityFact(
              entityId,
              fact
            )
        )
      );

    return results as RulesetEntityFact<T>[];
  }

  private async requestEntityFact(
    entityId: string,
    fact: string
  ): Promise<RulesetEntityFact>
  {
    const source =
      entityId.charAt(0);

    if (source === 'T')
    {
      return this.requestTemporaryFact(
        entityId,
        fact
      );
    }

    throw new Error(
      `No entity fact provider is registered for "${entityId}".`
    );
  }

  private async requestTemporaryFact(
    entityId: string,
    fact: string
  ): Promise<RulesetEntityFact>
  {
    if (fact === 'movement')
    {
      const movement: MovementFact = {
        speed: 30,
      };

      return {
        entityId,
        value: movement,
      };
    }

    throw new Error(
      `Temporary entity "${entityId}" does not provide fact "${fact}".`
    );
  }
}

export const entityFactService =
  new EntityFactService();