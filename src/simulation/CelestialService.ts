
import {
  createDefaultCelestialSettings,
  type CelestialSettings,
} from './CelestialSettings';

type CelestialListener = (
  settings: CelestialSettings
) => void;

export class CelestialService
{
  private settings: CelestialSettings =
    createDefaultCelestialSettings();

  private listeners =
    new Set<CelestialListener>();

  getSettings(): CelestialSettings
  {
    return structuredClone(
      this.settings
    );
  }

  setSettings(
    settings: CelestialSettings
  ): void
  {
    this.settings =
      structuredClone(settings);

    this.notify();
  }

  restoreWorldState(
    settings?: CelestialSettings
  ): void
  {
    this.settings = structuredClone(
      settings ??
        createDefaultCelestialSettings()
    );

    this.notify();
  }

  subscribe(
    listener: CelestialListener
  ): () => void
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
        this.getSettings()
      );
    }
  }
}

export const celestialService =
  new CelestialService();
