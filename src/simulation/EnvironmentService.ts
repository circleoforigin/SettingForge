import {
  type EnvironmentSettings,
  type EnvironmentState,
} from './EnvironmentSettings';
import type { WorldRulesetReference } from '../models/World';
import type {
  EnvironmentDefinitions,
  EnvironmentDefinitionOverrides,
} from './EnvironmentDefinitions';
import { resolveEffectiveEnvironmentDefinitions } from './EnvironmentDefinitionResolver';
import { createInitialEnvironmentState } from './EnvironmentStateFactory';

type EnvironmentListener = (
  state: EnvironmentState | undefined,
  settings: EnvironmentSettings
) => void;

export class EnvironmentService
{
  private settings: EnvironmentSettings = {
    displayFormat: '',
  };

  private state: EnvironmentState | undefined;
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
    this.definitionOverrides = structuredClone(overrides);

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

    this.definitionOverrides = structuredClone(overrides ?? {});

    this.definitions =
      resolveEffectiveEnvironmentDefinitions(
        this.ruleset,
        this.definitionOverrides
      );

    if (!this.definitions)
    {
        this.state = undefined;
    }

    if (this.definitions && !this.state)
    {
        this.state = createInitialEnvironmentState(this.definitions);
    }

    this.notify();
  }

  getSettings(): EnvironmentSettings
  {
    return structuredClone(this.settings);
  }

getState(): EnvironmentState | undefined
{
  return this.state
    ? structuredClone(this.state)
    : undefined;
}

restoreWorldState(
  settings?: EnvironmentSettings,
  state?: EnvironmentState
): void
{
  this.settings = structuredClone(
    settings ?? { displayFormat: '' }
  );

if (state)
{
  const saved = state as EnvironmentState & {
    storm?: {
      typeId?: string;
      severity?: number;
    };
  };

  const restored = structuredClone(saved);

  const defaults = this.definitions
    ? createInitialEnvironmentState(this.definitions)
    : undefined;

  this.state = {
    seasonId: restored.seasonId,
    temperature: restored.temperature,
    visibility: {
        typeId:
            restored.visibility?.typeId ??
            defaults?.visibility.typeId ??
            '',
        },
    cloudCoverTypeId:
        restored.cloudCoverTypeId ??
        defaults?.cloudCoverTypeId ??
        '',
    precipitation: {
      typeId: restored.precipitation.typeId,
    },
    specialWeatherTypeId:
      restored.specialWeatherTypeId ??
      restored.storm?.typeId ??
      'none',
    wind: restored.wind,
  };
}
else
{
  this.state = undefined;
}

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
