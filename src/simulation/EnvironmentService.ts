import {
  createDefaultEnvironmentSettings,
  createDefaultEnvironmentState,
  type EnvironmentSettings,
  type EnvironmentState,
} from './EnvironmentSettings';

type EnvironmentListener = (
  state: EnvironmentState,
  settings: EnvironmentSettings
) => void;

export class EnvironmentService
{
  private settings =
    createDefaultEnvironmentSettings();

  private state =
    createDefaultEnvironmentState();

  private listeners =
    new Set<EnvironmentListener>();

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
