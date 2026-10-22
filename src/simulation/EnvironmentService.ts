import {
  createDefaultEnvironmentSettings,
  createDefaultEnvironmentState,
  type EnvironmentSettings,
  type EnvironmentState,
} from './EnvironmentSettings';
import type { WorldRulesetReference } from '../models/World';
import type {
  EnvironmentDefinitions,
  EnvironmentDefinitionOverrides,
} from './EnvironmentDefinitions';
import { resolveEffectiveEnvironmentDefinitions } from './EnvironmentDefinitionResolver';

type EnvironmentListener = (
  state: EnvironmentState,
  settings: EnvironmentSettings
) => void;

export class EnvironmentService
{
  private settings = createDefaultEnvironmentSettings();
  private state = createDefaultEnvironmentState();
  private definitions: EnvironmentDefinitions | undefined;
  private ruleset: WorldRulesetReference | undefined;
  private definitionOverrides: EnvironmentDefinitionOverrides = {};
  private listeners = new Set<EnvironmentListener>();

  getDefinitions(): EnvironmentDefinitions | undefined
  {
    return this.definitions
      ? structuredClone(this.definitions)
      : undefined;
  }

    getDefinitionOverrides():
    EnvironmentDefinitionOverrides
  {
    return structuredClone(
      this.definitionOverrides
    );
  }

  setDefinitionOverrides(
    overrides: EnvironmentDefinitionOverrides
  ): void
  {
    this.definitionOverrides =
      structuredClone(overrides);

    this.definitions =
      resolveEffectiveEnvironmentDefinitions(
        this.ruleset,
        this.definitionOverrides
      );

    this.notify();
  }

  setRuleset(
    ruleset: WorldRulesetReference | undefined,
    overrides?: EnvironmentDefinitionOverrides
  ): void
  {
    this.ruleset = ruleset
      ? structuredClone(ruleset)
      : undefined;

    this.definitionOverrides =
      structuredClone(overrides ?? {});

    this.definitions =
      resolveEffectiveEnvironmentDefinitions(
        this.ruleset,
        this.definitionOverrides
      );

    this.notify();
  }

  getSettings(): EnvironmentSettings
  {
    return structuredClone(this.settings);
  }

  getState(): EnvironmentState
  {
    return structuredClone(this.state);
  }

  restoreWorldState(
    settings?: EnvironmentSettings,
    state?: EnvironmentState
  ): void
  {
    this.settings = {
        ...createDefaultEnvironmentSettings(),
        ...(settings
            ? structuredClone(settings)
            : {}),
    };

    this.state = structuredClone(
      state ?? createDefaultEnvironmentState()
    );

    this.notify();
  }

  setSettings(settings: EnvironmentSettings): void
  {
    this.settings = structuredClone(settings);
    this.notify();
  }

  setState(state: EnvironmentState): void
  {
    this.state = structuredClone(state);
    this.notify();
  }

  subscribe(listener: EnvironmentListener): () => void
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
      listener(
        this.getState(),
        this.getSettings()
      );
    }
  }
}

export const environmentService =
  new EnvironmentService();
