import type {
  RulesetDefinition,
} from './RulesetDefinition';

type RulesetRegistryListener =
  () => void;

function rulesetKey(
  id: string,
  version: string
): string {
  return `${id}@${version}`;
}

function cloneRuleset(
  ruleset: RulesetDefinition
): RulesetDefinition {
  return {
    ...ruleset,

    requirements:
      ruleset.requirements.map(
        (requirement) => ({
          ...requirement,
        })
      ),
  };
}

export class RulesetRegistry {
  private readonly rulesets =
    new Map<string, RulesetDefinition>();

  private readonly listeners =
    new Set<RulesetRegistryListener>();

  register(
    ruleset: RulesetDefinition
  ): void {
    if (
      !ruleset.id ||
      !ruleset.name ||
      !ruleset.version
    ) {
      throw new Error(
        'Ruleset must have an id, name, and version.'
      );
    }

    const key =
      rulesetKey(
        ruleset.id,
        ruleset.version
      );

    this.rulesets.set(
      key,
      cloneRuleset(ruleset)
    );

    this.notify();
  }

  unregister(
    id: string,
    version: string
  ): void {
    const removed =
      this.rulesets.delete(
        rulesetKey(id, version)
      );

    if (removed) {
      this.notify();
    }
  }

  get(
    id: string,
    version: string
  ): RulesetDefinition | undefined {
    const ruleset =
      this.rulesets.get(
        rulesetKey(id, version)
      );

    return ruleset
      ? cloneRuleset(ruleset)
      : undefined;
  }

  getAll(): RulesetDefinition[] {
    return Array.from(
      this.rulesets.values()
    )
      .map(cloneRuleset)
      .sort(
        (left, right) =>
          left.name.localeCompare(
            right.name
          ) ||
          left.version.localeCompare(
            right.version
          )
      );
  }

  subscribe(
    listener: RulesetRegistryListener
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (
      const listener
      of this.listeners
    ) {
      listener();
    }
  }
}

export const rulesetRegistry =
  new RulesetRegistry();